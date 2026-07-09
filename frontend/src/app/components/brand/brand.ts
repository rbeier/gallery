import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'

/** Wordmark + camera logo, linking home. Shared by the header and the viewer sidebar. */
@Component({
  selector: 'app-brand',
  imports: [RouterLink],
  templateUrl: './brand.html',
  styleUrl: './brand.css',
})
export class Brand {}
