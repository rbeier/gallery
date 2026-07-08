import { Pipe, type PipeTransform } from '@angular/core'
import type { Photo } from '../models/photo'
import { photoMeta } from '../util/photo-meta'

@Pipe({ name: 'photoMeta' })
export class PhotoMetaPipe implements PipeTransform {
  transform(photo: Photo): string {
    return photoMeta(photo)
  }
}
