import React, { useEffect, useRef } from 'react';
import type { Core } from '../types';
import { MapPin, Droplet, Pencil, LocateFixed, Trash2, Download, Loader2 } from 'lucide-react';

// OpenLayers imports
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { fromLonLat } from 'ol/proj';
import { Style, Circle, Fill, Stroke } from 'ol/style';

interface CoreDetailsProps {
  core: Core;
  onEdit: (core: Core) => void;
  onDelete: (coreId: string) => void;
  onGoToMap: () => void;
  onGenerateFullReport: () => void;
  isGeneratingFullReport: boolean;
}

const DetailItem: React.FC<{ icon: React.ReactNode; label: string; value: string | number }> = ({ icon, label, value }) => (
    <div className="flex flex-col bg-background-tertiary/80 p-3 rounded-lg backdrop-blur-sm h-full">
        <div className="flex items-center text-sm text-content-muted mb-1">
            {icon}
            <span className="ml-2">{label}</span>
        </div>
        <span className="text-base font-semibold text-content-primary">{value}</span>
    </div>
);


const CoreDetails: React.FC<CoreDetailsProps> = ({ core, onEdit, onDelete, onGoToMap, onGenerateFullReport, isGeneratingFullReport }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Map | null>(null);
  const featureRef = useRef<Feature<Point> | null>(null);

  // Effect to initialize map
  useEffect(() => {
      if (!mapContainerRef.current || mapInstance.current) return;
      
      featureRef.current = new Feature(new Point(fromLonLat([0,0])));
      const vectorSource = new VectorSource({ features: [featureRef.current] });

      const map = new Map({
          target: mapContainerRef.current,
          layers: [
              new TileLayer({
                  source: new XYZ({
                      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}',
                  }),
              }),
              new VectorLayer({
                  source: vectorSource,
                  style: new Style({
                      image: new Circle({
                          radius: 9,
                          fill: new Fill({ color: 'rgba(234, 179, 8, 1)' }), // amber-500
                          stroke: new Stroke({ color: '#ffffff', width: 3 }),
                      }),
                  }),
              })
          ],
          view: new View({
              center: fromLonLat([0, 0]),
              zoom: 5,
          }),
          // By removing `interactions` and `controls`, we get the default interactive behavior.
      });
      mapInstance.current = map;
      
      return () => {
          mapInstance.current?.setTarget(undefined);
          mapInstance.current = null;
      };
  }, []); // Empty dependency array, runs once.

  // Effect to update map when core changes
  useEffect(() => {
      if (mapInstance.current && featureRef.current) {
          const newCenter = fromLonLat([core.location.lon, core.location.lat]);
          mapInstance.current.getView().animate({
              center: newCenter,
              duration: 600,
              zoom: 5,
          });
          (featureRef.current.getGeometry() as Point).setCoordinates(newCenter);
      }
      const timer = setTimeout(() => mapInstance.current?.updateSize(), 310);
      return () => clearTimeout(timer);
  }, [core]);

  return (
    <div className="relative bg-background-tertiary/40 rounded-xl shadow-lg border border-border-primary/50 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-background-primary/20 via-background-secondary/10 to-transparent" />
      
      <div className="relative z-10 p-5">
        <div className="flex flex-wrap justify-between items-start mb-4 gap-x-6 gap-y-4">
          <div className="flex items-start gap-4 flex-wrap">
            <div>
                <h1 className="text-3xl font-extrabold text-content-primary tracking-tight">{core.id}</h1>
                <p className="text-content-muted mt-1">{core.name}</p>
            </div>
            <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={onGenerateFullReport}
                  disabled={isGeneratingFullReport}
                  className="p-2 rounded-md bg-background-interactive/60 text-content-secondary hover:bg-background-interactive-hover hover:text-content-primary transition-colors disabled:cursor-wait"
                  aria-label="Download Full Core Report"
                  title="Download Full Core Report"
                >
                    {isGeneratingFullReport ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                </button>
                <button onClick={() => onEdit(core)} className="p-2 rounded-md bg-background-interactive/60 text-content-secondary hover:bg-background-interactive-hover hover:text-content-primary transition-colors" aria-label="Edit Core" title="Edit Core">
                    <Pencil size={18} />
                </button>
                <button onClick={() => onDelete(core.id)} className="p-2 rounded-md bg-danger-primary/20 text-danger-primary hover:bg-danger-primary/40 hover:text-content-inverted transition-colors" aria-label="Delete Core" title="Delete Core">
                    <Trash2 size={18} />
                </button>
            </div>
          </div>
          
          <div className="flex-shrink-0 text-right">
              <p className="text-sm font-semibold text-content-secondary">{core.project}</p>
              <p className="text-xs text-content-muted mt-1">Project</p>
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Details Column */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-grow">
            <div className="flex flex-col bg-background-tertiary/80 p-3 rounded-lg justify-between backdrop-blur-sm h-full">
                <div className="flex items-center text-sm text-content-muted mb-1">
                    <MapPin size={16} />
                    <span className="ml-2">Location</span>
                </div>
                <div className="flex items-end justify-between">
                    <span className="text-base font-semibold text-content-primary">{`${core.location.lat.toFixed(4)}°, ${core.location.lon.toFixed(4)}°`}</span>
                    <button
                        onClick={onGoToMap}
                        className="p-1 rounded-md text-content-muted hover:bg-background-interactive hover:text-accent-primary-hover transition-colors"
                        aria-label="Show on map"
                        title="Show on map"
                    >
                        <LocateFixed size={18} />
                    </button>
                </div>
            </div>
            <DetailItem icon={<Droplet size={16} />} label="Water Depth" value={`${core.waterDepth} m`} />
          </div>

          {/* Map Column */}
          <div
            ref={mapContainerRef}
            className="flex-shrink-0 rounded-xl overflow-hidden bg-background-primary/20 border border-border-secondary w-full h-48 lg:w-48 lg:h-48"
            aria-label="Mini-map showing core location"
          >
            {/* Map is rendered here by OpenLayers */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoreDetails;