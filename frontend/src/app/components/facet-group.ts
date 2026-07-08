import { Component, input, output } from '@angular/core'
import type { FacetGroup as FacetGroupModel } from '../models/gallery.models'

@Component({
  selector: 'app-facet-group',
  template: `
    <div class="mt-5">
      <div class="mb-[9px] font-mono text-[10px] uppercase tracking-label text-muted">
        {{ group().label }}
      </div>
      <div class="flex flex-wrap gap-[7px]">
        @for (opt of group().options; track opt) {
          @let active = selected().includes(opt);
          <button
            type="button"
            [attr.aria-pressed]="active"
            (click)="toggle.emit(opt)"
            class="rounded-pill border px-[11px] py-[6px] font-mono text-[11px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            [class.border-ink]="active"
            [class.bg-ink]="active"
            [class.text-bg]="active"
            [class.border-line]="!active"
            [class.text-ink]="!active"
          >
            {{ opt }}
          </button>
        }
      </div>
    </div>
  `,
})
export class FacetGroup {
  readonly group = input.required<FacetGroupModel>()
  readonly selected = input<string[]>([])
  readonly toggle = output<string>()
}
