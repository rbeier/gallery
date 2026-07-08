import { Pipe, type PipeTransform } from '@angular/core'
import { shortLocation } from '../util/short-location'

@Pipe({ name: 'shortLocation' })
export class ShortLocationPipe implements PipeTransform {
  transform(location: string): string {
    return shortLocation(location)
  }
}
