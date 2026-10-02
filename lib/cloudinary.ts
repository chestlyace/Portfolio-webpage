export interface CloudinaryOptions {
  width?: number;
  height?: number;
  crop?: string;
}

export function optimizeCloudinaryImage(
  url: string,
  options: CloudinaryOptions = {},
): string {
  if (!url || !url.includes('/image/upload/')) {
    return url;
  }

  const transforms = ['f_auto', 'q_auto:good'];

  if (options.width) transforms.push(`w_${options.width}`);
  if (options.height) transforms.push(`h_${options.height}`);
  if (options.crop) transforms.push(`c_${options.crop}`);

  return url.replace('/image/upload/', `/image/upload/${transforms.join(',')}/`);
}
