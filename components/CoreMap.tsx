
import React, { useEffect, useRef } from 'react';
import type { Core } from '../types';

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
import Overlay from 'ol/Overlay';

const CoreMap: React.FC<{
  cores: Core[];
  selectedCore: Core | null;
  onSelectCore: (core: Core) => void;
  isSidebarCollapsed: boolean;
}> = ({ cores, selectedCore, onSelectCore, isSidebarCollapsed }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Map | null>(null);
  const vectorSource = useRef(new VectorSource());
  const tooltipOverlay = useRef<Overlay | null>(null);
  const tooltipElementRef = useRef<HTMLDivElement | null>(null);
  
  // Use refs to store the latest props for use in OpenLayers event handlers, avoiding stale closures.
  const coresRef = useRef(cores);
  coresRef.current = cores;
  const onSelectCoreRef = useRef(onSelectCore);
  onSelectCoreRef.current = onSelectCore;
  const selectedCoreRef = useRef(selectedCore);
  selectedCoreRef.current = selectedCore;


  // Initialize map on component mount
  useEffect(() => {
    if (!mapContainerRef.current || mapInstance.current) return;

    // Create tooltip element imperatively to avoid race conditions
    const tooltipEl = document.createElement('div');
    tooltipEl.className = 'ol-tooltip ol-tooltip-hidden';
    mapContainerRef.current.appendChild(tooltipEl);
    tooltipElementRef.current = tooltipEl;

    tooltipOverlay.current = new Overlay({
      element: tooltipEl,
      autoPan: { animation: { duration: 250 } },
    });


    // Base styles for a light map with terrain
    const defaultStyle = new Style({
      image: new Circle({
        radius: 7,
        fill: new Fill({ color: 'rgba(59, 130, 246, 0.9)' }), // blue-500
        stroke: new Stroke({ color: '#ffffff', width: 2 }),
      }),
    });

    const selectedStyle = new Style({
      image: new Circle({
        radius: 10,
        fill: new Fill({ color: 'rgba(234, 179, 8, 1)' }), // amber-500
        stroke: new Stroke({ color: '#ffffff', width: 3 }),
      }),
      zIndex: 10,
    });
    
    const hoverStyle = new Style({
      image: new Circle({
        radius: 9,
        fill: new Fill({ color: 'rgba(96, 165, 250, 1)' }), // blue-400
        stroke: new Stroke({ color: '#ffffff', width: 2.5 }),
      }),
    });

    const styleFunction = (feature: Feature<Point>) => {
        return feature.get('id') === selectedCoreRef.current?.id ? selectedStyle : defaultStyle;
    };

    const vectorLayer = new VectorLayer({
      source: vectorSource.current,
      style: styleFunction,
    });

    const rasterLayer = new TileLayer({
      source: new XYZ({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}',
        attributions: 'Tiles &copy; Esri &mdash; Sources: GEBCO, NOAA, National Geographic, DeLorme, NAVTEQ, and Esri',
      }),
    });

    const map = new Map({
      target: mapContainerRef.current,
      layers: [rasterLayer, vectorLayer],
      overlays: [tooltipOverlay.current],
      view: new View({
        center: fromLonLat([0, 0]),
        zoom: 2,
        minZoom: 2,
      }),
    });
    mapInstance.current = map;

    mapInstance.current.on('singleclick', (event) => {
        let featureFound = false;
        mapInstance.current?.forEachFeatureAtPixel(event.pixel, (feature) => {
            if (feature) {
                const coreId = feature.get('id');
                const core = coresRef.current.find(c => c.id === coreId);
                if (core) {
                    onSelectCoreRef.current(core);
                    featureFound = true;
                }
            }
            return featureFound;
        });
    });

    let hoveredFeature: Feature<Point> | null = null;
    mapInstance.current.on('pointermove', (event) => {
        const tooltip = tooltipElementRef.current;
        if (event.dragging || !tooltip) {
            tooltip?.classList.add('ol-tooltip-hidden');
            return;
        }
        const map = mapInstance.current!;
        const pixel = map.getEventPixel(event.originalEvent);
        const featureAtPixel = map.forEachFeatureAtPixel(pixel, f => f) as Feature<Point> | undefined;

        // Reset previous hover effect
        if (hoveredFeature && hoveredFeature !== featureAtPixel) {
            hoveredFeature.setStyle(undefined);
            hoveredFeature = null;
        }

        map.getTargetElement().style.cursor = featureAtPixel ? 'pointer' : '';

        if (featureAtPixel) {
            hoveredFeature = featureAtPixel;

            // Apply hover style if not selected
            if (hoveredFeature.get('id') !== selectedCoreRef.current?.id) {
                hoveredFeature.setStyle(hoverStyle);
            }

            // Show tooltip
            const coreId = hoveredFeature.get('id');
            const coreData = coresRef.current.find(c => c.id === coreId);

            if (coreData && tooltip && tooltipOverlay.current) {
                tooltip.innerHTML = `
                    <div class="tooltip-title">${coreData.id}</div>
                    <div class="tooltip-line">${coreData.name}</div>
                    <div class="tooltip-line">
                        <strong>Loc:</strong> ${coreData.location.lat.toFixed(2)}°, ${coreData.location.lon.toFixed(2)}°
                    </div>
                `;
                tooltipOverlay.current.setPosition(event.coordinate);
                tooltip.classList.remove('ol-tooltip-hidden');
            }
        } else {
            tooltip.classList.add('ol-tooltip-hidden');
        }
    });
    
    const viewport = mapInstance.current.getViewport();
    const handleMouseOut = () => {
        if (hoveredFeature) {
            hoveredFeature.setStyle(undefined);
            hoveredFeature = null;
        }
        tooltipElementRef.current?.classList.add('ol-tooltip-hidden');
    };
    viewport.addEventListener('mouseout', handleMouseOut);

    return () => {
      viewport.removeEventListener('mouseout', handleMouseOut);
      mapInstance.current?.setTarget(undefined);
      mapInstance.current = null;
      // Cleanup the imperatively created element
      if (mapContainerRef.current && tooltipElementRef.current) {
          mapContainerRef.current.removeChild(tooltipElementRef.current);
      }
      tooltipElementRef.current = null;
    };
  }, []);


  // Update features when cores data changes
  useEffect(() => {
    const source = vectorSource.current;
    source.clear();
    const features = cores.map(core => {
      const feature = new Feature({
        geometry: new Point(fromLonLat([core.location.lon, core.location.lat])),
        id: core.id,
      });
      return feature;
    });
    source.addFeatures(features);
  }, [cores]);
  

  // Pan/zoom to selected core and update styles
  useEffect(() => {
    vectorSource.current.changed(); // Redraw layer to apply style changes
    if (selectedCore && mapInstance.current) {
      const view = mapInstance.current.getView();
      view.animate({
        center: fromLonLat([selectedCore.location.lon, selectedCore.location.lat]),
        zoom: Math.max(view.getZoom() || 0, 5),
        duration: 800,
      });
    }
  }, [selectedCore]);

  // Update map size when sidebar collapses/expands
  useEffect(() => {
    if (mapInstance.current) {
      // Wait for the CSS transition to complete before updating the map size
      const timer = setTimeout(() => {
        mapInstance.current?.updateSize();
      }, 310); // a bit more than the transition duration
      return () => clearTimeout(timer);
    }
  }, [isSidebarCollapsed]);


  return (
    <div className="h-full w-full relative">
        <div className="h-full w-full bg-slate-900" ref={mapContainerRef} style={{ cursor: 'grab' }}>
            {/* Map and tooltip will be rendered here */}
        </div>
    </div>
  );
};

export default CoreMap;
