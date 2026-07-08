import { Pipe, type PipeTransform } from '@angular/core'
import { formatMonth } from '../util/format-month'

@Pipe({ name: 'formatMonth' })
export class FormatMonthPipe implements PipeTransform {
  transform(ym: string): string {
    return formatMonth(ym)
  }
}
