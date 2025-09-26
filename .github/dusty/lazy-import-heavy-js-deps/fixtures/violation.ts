import * as AWS from 'aws-sdk';

export function upload(data: Buffer): Promise<string> {
  const s3 = new AWS.S3();
  return s3
    .upload({ Bucket: 'my-bucket', Key: 'file.bin', Body: data })
    .promise()
    .then((r: any) => r.Location);
}

export class Runner {
  run(): any {
    const s3 = new AWS.S3();
    return s3.listBuckets().promise();
  }
  noop() {
    return 'noop';
  }
}

export function noHeavy(): string {
  return 'no heavy module used';
}
