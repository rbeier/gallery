import { Pipe, type PipeTransform } from '@angular/core'
import type { Photo } from '../models/gallery.models'
import { formatMonth, photoMeta, shortLocation } from '../util/gallery.util'

@Pipe({ name: 'shortLocation' })
export class ShortLocationPipe implements PipeTransform {
  transform(location: string): string {
    return shortLocation(location)
  }
}

@Pipe({ name: 'formatMonth' })
export class FormatMonthPipe implements PipeTransform {
  transform(ym: string): string {
    return formatMonth(ym)
  }
}

@Pipe({ name: 'photoMeta' })
export class PhotoMetaPipe implements PipeTransform {
  transform(photo: Photo): string {
    return photoMeta(photo)
  }
}
