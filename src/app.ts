import express from 'express';
import OrchyBase from 'orchy-base-code7';
import SnsSqsSlq from 'sns-sqs-slq-code7';

import { associatesQueueWithLambda } from './utils/aws/index';

import 'dotenv/config';

import middlewares from './middlewares/index';

const app = express();

middlewares(app);

const orchybase = new OrchyBase(true);
const snsSqs = new SnsSqsSlq();

async function getQueueContacts() {
  const queueContacts = await orchybase.getQueueContacts(2, {
    state: 'pending',
  });

  console.log(queueContacts);

  if (queueContacts.length > 0) {
    const topic = await snsSqs.createOrGetTopic('sns-event');

    queueContacts.forEach(async (queueContact) => {
      const queueInfo = await snsSqs.createOrGetQueue(
        `sqs-event-${queueContact.api_key}`,
      );

      const queueName = queueInfo.QueueUrl.split('/')[4];

      const sub = await snsSqs.subscribeToTopic(
        topic.TopicArn,
        `arn:aws:sqs:${process.env.AWS_REGION}:${process.env.AWS_ID_ACCOUNT}:${queueName}`,
        queueInfo.QueueUrl,
      );

      console.log('sub:', sub);

      snsSqs.setFilterPolicyAttributeInSubscription(sub.SubscriptionArn, {
        api_key: [queueContact.api_key],
      });

      associatesQueueWithLambda(queueName);

      const publish = await snsSqs.publishToTopic(
        topic.TopicArn.split(':')[5],
        JSON.stringify({
          id_flow: queueContact.id_flow,
          api_key: queueContact.api_key,
          id_contact_data: queueContact.id_contact_data,
          id_item: queueContact.id_item,
          event_type: queueContact.event_type,
          data_type: queueContact.data_type,
          contact_data: queueContact.contact_data,
          message: queueContact.message,
        }),
        Date.now().toString(),
        Date.now().toString(),
        topic.TopicArn,
        {
          api_key: {
            DataType: 'String',
            StringValue: queueContact.api_key,
          },
        },
      );

      console.log('publish:', publish);
    });
  }
}

setInterval(() => {
  getQueueContacts();
}, parseInt(process.env.LOOP_TIME, 10));

export default app;
