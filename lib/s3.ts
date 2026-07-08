// Presigned-upload helper for the seller sample-photo flow.
//
// The bucket named by PHOTOS_BUCKET_NAME does not exist yet (real infra is a
// separate, not-yet-deployed piece of work) — this is built against an env
// var placeholder (see .env.example) and has not been live-tested against S3.
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

const REGION = process.env.AWS_REGION || process.env.COGNITO_REGION;
const BUCKET = process.env.PHOTOS_BUCKET_NAME;

function getClient(): S3Client {
  return new S3Client({ region: REGION });
}

export interface PresignedUpload {
  /** Client PUTs the file body directly to this URL. */
  uploadUrl: string;
  /** Public object URL to store in Postgres once the upload succeeds. */
  fileUrl: string;
  key: string;
}

/** Issues a short-lived presigned PUT URL for a single sample-photo upload. */
export async function createPresignedUpload(
  fileName: string,
  contentType: string,
  keyPrefix = "seller-sample-photos",
): Promise<PresignedUpload> {
  if (!BUCKET) {
    throw new Error("PHOTOS_BUCKET_NAME is not configured");
  }

  const extension = fileName.includes(".") ? fileName.split(".").pop() : undefined;
  const key = `${keyPrefix}/${randomUUID()}${extension ? `.${extension}` : ""}`;

  const client = getClient();
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 300 });
  const fileUrl = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;

  return { uploadUrl, fileUrl, key };
}
