import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class UploadsService {
  private s3Client: S3Client;
  private bucket: string;
  private region: string;

  constructor(private configService: ConfigService) {
    this.region = this.configService.get<string>('aws.region') || 'us-east-1';
    this.bucket =
      this.configService.get<string>('aws.s3Bucket') || 'inboxhunter-storage';

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.configService.get<string>('aws.accessKeyId') || '',
        secretAccessKey:
          this.configService.get<string>('aws.secretAccessKey') || '',
      },
    });
  }

  async uploadFile(
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    });

    await this.s3Client.send(command);
    return this.getPublicUrl(key);
  }

  async uploadScreenshot(
    userId: string,
    taskId: string,
    screenshot: Buffer,
    filename?: string,
  ): Promise<string> {
    const timestamp = Date.now();
    const name = filename || `screenshot-${timestamp}.png`;
    const key = `screenshots/${userId}/${taskId}/${name}`;

    return this.uploadFile(key, screenshot, 'image/png');
  }

  async getUploadUrl(
    key: string,
    contentType: string,
    expiresIn = 3600,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  async getDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  getPublicUrl(key: string): string {
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  async listFiles(prefix: string): Promise<string[]> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: prefix,
    });

    const response = await this.s3Client.send(command);
    return (response.Contents || [])
      .map((item) => item.Key)
      .filter((key): key is string => key !== undefined);
  }

  async getLatestRelease(): Promise<{
    version: string;
    downloads: { windows?: string; macos?: string; linux?: string };
  } | null> {
    const files = await this.listFiles('downloads/');

    // Extract versions
    const versionSet = new Set<string>();
    files.forEach((path) => {
      const match = path.match(/downloads\/(v[\d.]+)\//);
      if (match) {
        versionSet.add(match[1]);
      }
    });

    // Sort versions
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
    const releaseFiles = await this.listFiles(`downloads/${latestVersion}/`);

    const downloads: { windows?: string; macos?: string; linux?: string } = {};
    releaseFiles.forEach((file) => {
      if (file.includes('windows') || file.endsWith('.exe')) {
        downloads.windows = this.getPublicUrl(file);
      } else if (file.includes('macos')) {
        downloads.macos = this.getPublicUrl(file);
      } else if (file.includes('linux')) {
        downloads.linux = this.getPublicUrl(file);
      }
    });

    return { version: latestVersion, downloads };
  }
}

