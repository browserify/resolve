import { S3 } from 'aws-sdk';

const CLIENT = new S3();

export function process(): Promise<any> {
  return CLIENT.listBuckets().promise();
}

export function noHeavy(): string {
  return 'no heavy module used';
}

export class Processor {
  run() {
    return CLIENT.listBuckets().promise();
  }
  noop() {
    return 'noop';
  }
}

