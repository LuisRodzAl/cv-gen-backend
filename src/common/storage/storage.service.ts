import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class StorageService {
  private readonly supabase: SupabaseClient;
  private readonly bucket = 'cv_gen_info';

  constructor(configService: ConfigService) {
    this.supabase = createClient(
      configService.getOrThrow<string>('supabase.url'),
      configService.getOrThrow<string>('supabase.serviceKey'),
    );
  }

  async uploadFile(userId: string, file: Buffer, mimeType: string, fileName: string): Promise<string> {
    const path = `certificates/${userId}/${Date.now()}-${fileName}`;

    const { error } = await this.supabase.storage
      .from(this.bucket)
      .upload(path, file, { contentType: mimeType, upsert: false });

    if (error) throw new Error(`Error al subir archivo: ${error.message}`);

    const { data } = this.supabase.storage.from(this.bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  async deleteFile(url: string): Promise<void> {
    const path = url.split(`${this.bucket}/`)[1];
    if (!path) return;
    await this.supabase.storage.from(this.bucket).remove([path]);
  }
}
