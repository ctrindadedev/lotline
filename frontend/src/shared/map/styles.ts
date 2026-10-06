import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';

export const polygonStyle = new Style({
  fill: new Fill({ color: 'rgb(31 111 235 / 20%)' }),
  stroke: new Stroke({ color: '#1f6feb', width: 2 }),
});
