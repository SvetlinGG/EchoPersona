import { Component, Input } from '@angular/core';
import { EmotionVector } from '../../../core/services/models/emotion';

@Component({
  selector: 'app-emotion-meter',
  standalone: true,
  imports: [],
  templateUrl: './emotion-meter.component.html',
  styleUrl: './emotion-meter.component.css'
})
export class EmotionMeterComponent {
  @Input() emotion?: EmotionVector;

  get transform(){
    const x = ((this.emotion?.valence ?? 0) + 1) / 2;
    const y = 1 - (this.emotion?.arousal ?? 0);
    const px = ( x * 200) - 100;
    const py = ( y * 80) - 40;
    return `translate(${px}px, ${py}px)`;
  }

}
