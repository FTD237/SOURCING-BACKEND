// common/services/link-checker.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class LinkCheckerService {
  async isReachable(url: string, timeoutMs = 5000): Promise<boolean> {
    if (await this.tryFetch(url, 'HEAD', timeoutMs)) {
      return true;
    }
    return this.tryFetch(url, 'GET', timeoutMs);
  }

  private async tryFetch(
    url: string,
    method: 'HEAD' | 'GET',
    timeoutMs: number,
  ): Promise<boolean> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, { method, signal: controller.signal });
      return response.ok;
    } catch {
      return false;
    } finally {
      clearTimeout(timeout);
    }
  }

  async validateLinksOrThrow(
    links: Record<string, string | undefined | null>,
  ): Promise<void> {
    const entries = Object.entries(links).filter(([, url]) => !!url) as [
      string,
      string,
    ][];

    const results = await Promise.all(
      entries.map(async ([field, url]) => ({
        field,
        url,
        reachable: await this.isReachable(url),
      })),
    );

    const unreachable = results.filter((r) => !r.reachable);
    if (unreachable.length > 0) {
      const details = unreachable
        .map((r) => `${r.field} (${r.url})`)
        .join(', ');
      throw new BadRequestException(`Lien(s) inaccessible(s) : ${details}`);
    }
  }
}
