// Presigned-upload helper backing three flows, split across two S3 buckets
// (see infra/lib/stacks/storage-stack.ts):
//  - "product-photos" -> the public product-photos bucket, fronted by
//    CloudFront (PHOTOS_CDN_DOMAIN) since the bucket itself blocks all
//    public access. fileUrl is a real, browser-loadable CDN URL.
//  - "seller-sample-photos" / "proof-of-handcrafted" -> the private
//    seller-vetting bucket (admin-review only, never public). fileUrl here
//    is a plain (non-loadable) S3 URL — a future admin-review feature must
//    re-sign a presigned GET from the stored key to actually view it.
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

const REGION = process.env.AWS_REGION || process.env.COGNITO_REGION;
const PRODUCT_PHOTOS_BUCKET = process.env.PHOTOS_BUCKET_NAME;
const CDN_DOMAIN = process.env.PHOTOS_CDN_DOMAIN;
const VETTING_BUCKET = process.env.SELLER_VETTING_BUCKET_NAME;

const VETTING_KEY_PREFIXES = new Set(["seller-sample-photos", "proof-of-handcrafted"]);

function getClient(): S3Client {
  return new S3Client({ region: REGION });
}

export interface PresignedUpload {
  /** Client PUTs the file body directly to this URL. */
  uploadUrl: string;
  /** Object URL to store in Postgres once the upload succeeds — only
   * browser-loadable for the "product-photos" prefix (see module doc above). */
  fileUrl: string;
  key: string;
}

/** Issues a short-lived presigned PUT URL for a single photo upload. */
export async function createPresignedUpload(
  fileName: string,
  contentType: string,
  keyPrefix = "seller-sample-photos",
): Promise<PresignedUpload> {
  const isVetting = VETTING_KEY_PREFIXES.has(keyPrefix);
  const bucket = isVetting ? VETTING_BUCKET : PRODUCT_PHOTOS_BUCKET;

  if (!bucket) {
    throw new Error(
      isVetting ? "SELLER_VETTING_BUCKET_NAME is not configured" : "PHOTOS_BUCKET_NAME is not configured",
    );
  }
  if (!isVetting && !CDN_DOMAIN) {
    throw new Error("PHOTOS_CDN_DOMAIN is not configured");
  }

  const extension = fileName.includes(".") ? fileName.split(".").pop() : undefined;
  const key = `${keyPrefix}/${randomUUID()}${extension ? `.${extension}` : ""}`;

  const client = getClient();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 300 });
  // The product-photos bucket blocks all public access — it's only reachable
  // through the CloudFront distribution fronting it, so its public-facing
  // URL must point there, never at the bucket directly. The vetting bucket
  // has no public URL at all by design (see module doc above).
  const fileUrl = isVetting
    ? `https://${bucket}.s3.${REGION}.amazonaws.com/${key}`
    : `https://${CDN_DOMAIN}/${key}`;

  return { uploadUrl, fileUrl, key };
}
