import React, { createContext, useContext, useReducer } from 'react';

const MapContext = createContext();

const mapReducer = (state, action) => {
    switch (action.type) {
        case 'SET_AQI_DATA':
            return { ...state, aqiData: action.payload };
        case 'TOGGLE_LAYER':
            return { ...state, showAQILayer: !state.showAQILayer };
        default:
            return state;
    }
};

export const MapProvider = ({ children }) => {
    const [state, dispatch] = useReducer(mapReducer, {
        aqiData: [],
        showAQILayer: false,
        selectedMapStyle: 'osm'
    });

    return (
        <MapContext.Provider value={{ state, dispatch }}>
            {children}
        </MapContext.Provider>
    );
};

export const useMapContext = () => useContext(MapContext);