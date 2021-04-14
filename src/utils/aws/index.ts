import AWS from 'aws-sdk';

export async function associatesQueueWithLambda(queueName: string) {
  const LAMBDA = new AWS.Lambda();

  const createEventSourceMappingResponse = await LAMBDA.createEventSourceMapping(
    {
      EventSourceArn: `arn:aws:sqs:${process.env.AWS_REGION}:${process.env.AWS_ID_ACCOUNT}:${queueName}`,
      FunctionName: `lbd-contact-event-dev-contactEvent`,
    },
  ).promise();

  return createEventSourceMappingResponse;
}
