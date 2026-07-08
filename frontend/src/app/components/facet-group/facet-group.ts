import { Component, input, output } from '@angular/core'
import type { FacetGroup as FacetGroupModel } from '../../models/gallery.models'

@Component({
  selector: 'app-facet-group',
  templateUrl: './facet-group.html',
  styleUrl: './facet-group.css',
})
export class FacetGroup {
  readonly group = input.required<FacetGroupModel>()
  readonly selected = input<string[]>([])
  readonly toggle = output<string>()
}
