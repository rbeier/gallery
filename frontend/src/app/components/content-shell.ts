import { Component } from '@angular/core'

/**
 * Centered content column. Responsive max-width matches the prototype:
 * mobile 640 / desktop 1180 / wide 1500, with the corresponding padding.
 */
@Component({
  selector: 'app-content-shell',
  template: `
    <div
      class="mx-auto w-full max-w-[640px] px-5 pt-6 pb-[110px] d:max-w-[1180px] d:px-10 d:pt-11 d:pb-[130px] w:max-w-[1500px]"
    >
      <ng-content />
    </div>
  `,
})
export class ContentShell {}
