export function measure(): boolean {
  // Already lazy via function-local require
  const AWS = require('aws-sdk');
  return !!AWS;
}

export function noHeavy(): string {
  return 'no heavy module used';
}

export class Checker {
  run() {
    const AWS = require('aws-sdk');
    return new AWS.S3().listBuckets().promise();
  }
  noop() {
    return 'noop';
  }
}

