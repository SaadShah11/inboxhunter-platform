import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config';

// Initialize S3 client
const s3Client = new S3Client({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  },
});

const BUCKET_NAME = config.aws.s3Bucket;

/**
 * Upload a file to S3
 */
export async function uploadFile(
  key: string,
  body: Buffer | Uint8Array | string,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  await s3Client.send(command);
  
  return getPublicUrl(key);
}

/**
 * Upload screenshot from agent
 */
export async function uploadScreenshot(
  userId: string,
  taskId: string,
  screenshot: Buffer,
  filename?: string
): Promise<string> {
  const timestamp = Date.now();
  const name = filename || `screenshot-${timestamp}.png`;
  const key = `screenshots/${userId}/${taskId}/${name}`;
  
  return uploadFile(key, screenshot, 'image/png');
}

/**
 * Upload agent installer/release
 */
export async function uploadRelease(
  version: string,
  platform: 'windows' | 'macos' | 'linux',
  fileBuffer: Buffer
): Promise<string> {
  const extensions: Record<string, string> = {
    windows: '.exe',
    macos: '',
    linux: '',
  };
  
  const filename = `InboxHunterAgent-${platform}${extensions[platform]}`;
  const key = `downloads/${version}/${filename}`;
  
  const contentType = platform === 'windows' 
    ? 'application/x-msdownload' 
    : 'application/octet-stream';
  
  return uploadFile(key, fileBuffer, contentType);
}

/**
 * Get a pre-signed URL for uploading (useful for direct client uploads)
 */
export async function getUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Get a pre-signed URL for downloading (for private files)
 */
export async function getDownloadUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Get public URL for a file (for publicly accessible files)
 */
export function getPublicUrl(key: string): string {
  return `https://${BUCKET_NAME}.s3.${config.aws.region}.amazonaws.com/${key}`;
}

/**
 * Delete a file from S3
 */
export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * List files in a directory
 */
export async function listFiles(prefix: string): Promise<string[]> {
  const command = new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
    Prefix: prefix,
  });

  const response = await s3Client.send(command);
  
  return (response.Contents || [])
    .map(item => item.Key)
    .filter((key): key is string => key !== undefined);
}

/**
 * Get latest release version
 */
export async function getLatestRelease(): Promise<{
  version: string;
  downloads: {
    windows?: string;
    macos?: string;
    linux?: string;
  };
} | null> {
  const versions = await listFiles('downloads/');
  
  // Extract version numbers from paths like "downloads/v2.0.0/"
  const versionSet = new Set<string>();
  versions.forEach(path => {
    const match = path.match(/downloads\/(v[\d.]+)\//);
    if (match) {
      versionSet.add(match[1]);
    }
  });
  
  // Sort versions (semver)
  const sortedVersions = Array.from(versionSet).sort((a, b) => {
    const aParts = a.replace('v', '').split('.').map(Number);
    const bParts = b.replace('v', '').split('.').map(Number);
    
    for (let i = 0; i < 3; i++) {
      if (aParts[i] !== bParts[i]) {
        return bParts[i] - aParts[i];
      }
    }
    return 0;
  });
  
  if (sortedVersions.length === 0) {
    return null;
  }
  
  const latestVersion = sortedVersions[0];
  const releaseFiles = await listFiles(`downloads/${latestVersion}/`);
  
  const downloads: { windows?: string; macos?: string; linux?: string } = {};
  
  releaseFiles.forEach(file => {
    if (file.includes('windows') || file.endsWith('.exe')) {
      downloads.windows = getPublicUrl(file);
    } else if (file.includes('macos')) {
      downloads.macos = getPublicUrl(file);
    } else if (file.includes('linux')) {
      downloads.linux = getPublicUrl(file);
    }
  });
  
  return {
    version: latestVersion,
    downloads,
  };
}

export { s3Client, BUCKET_NAME };

