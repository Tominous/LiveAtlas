/*
 * Copyright 2020 James Lyne
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

import {
	DynmapComponentConfig,
	DynmapWorldMap, DynmapMarkerSet, DynmapMarkerSetUpdates,
	DynmapMessageConfig,
	DynmapPlayer,
	DynmapServerConfig, DynmapTileUpdate,
	DynmapWorld, DynmapWorldState, Coordinate, DynmapParsedUrl, DynmapChat, DynmapUIElement
} from "@/dynmap";
import {DynmapProjection} from "@/leaflet/projection/DynmapProjection";

export type State = {
	version: string;
	configuration: DynmapServerConfig;
	messages: DynmapMessageConfig;
	components: DynmapComponentConfig;

	loggedIn: boolean;

	worlds: Map<string, DynmapWorld>;
	maps: Map<string, DynmapWorldMap>;
	players: Map<string, DynmapPlayer>;
	markerSets: Map<string, DynmapMarkerSet>;

	chat: {
		unread: number;
		messages: DynmapChat[];
	};

	pendingSetUpdates: Map<string, DynmapMarkerSetUpdates>;
	pendingTileUpdates: Array<DynmapTileUpdate>;

	followTarget?: DynmapPlayer;
	panTarget?: DynmapPlayer;

	currentWorldState: DynmapWorldState;
	currentWorld?: DynmapWorld;
	currentMap?: DynmapWorldMap;
	currentLocation: Coordinate;
	currentZoom: number;
	currentProjection: DynmapProjection;

	updateRequestId: number;
	updateTimestamp: Date;

	ui: {
		smallScreen: boolean;
		visibleElements: Set<DynmapUIElement>;
	};

	parsedUrl: DynmapParsedUrl;
}

export const state: State = {
	version: process.env.PACKAGE_VERSION || 'Unknown',

	configuration: {
		version: '',
		defaultMap: '',
		defaultWorld: '',
		defaultZoom: 0,
		followMap: '',
		followZoom: 0,
		updateInterval: 3000,
		showLayerControl: true,
		title: '',
		loginEnabled: false,
		maxPlayers: 0,
		grayHiddenPlayers: false,
		hash: 0,
	},

	messages: {
		chatNotAllowed: '',
		chatRequiresLogin: '',
		chatCooldown: '',
		mapTypes: '',
		players: '',
		playerJoin: '',
		playerQuit: '',
		anonymousJoin: '',
		anonymousQuit: '',
	},

	loggedIn: false,

	worlds: new Map(), //Defined (loaded) worlds with maps from configuration.json
	maps: new Map(), //Defined maps from configuration.json
	players: new Map(), //Online players from world.json

	chat: {
		unread: 0,
		messages: [],
	},

	markerSets: new Map(), //Markers from world_markers.json. Contents of each set isn't reactive for performance reasons.
	pendingSetUpdates: new Map(), //Pending updates to markers/areas/etc for each marker set
	pendingTileUpdates: [], //Pending updates to map tiles

	//Dynmap optional components
	components: {
		// "markers" component. Only used for default showLabels settings
		markers: {
			showLabels: false,
		},

		// Optional "playermarkers" component. Settings for online player markers.
		// If not present, player markers will be disabled
		playerMarkers: undefined,

		//Optional "coords" component. Adds control showing coordinates on map mouseover
		coordinatesControl: undefined,

		//Optional clock component. Used for both "digitalclock" and "timeofdayclock". Shows world time/weather.
		clockControl: undefined,

		//Optional "link" component. Adds button to copy url for current position
		linkControl: false,

		//Optional "logo" controls.
		logoControls: [],

		//Chat message sending functionality
		chatSending: undefined,

		//Chat box
		chatBox: undefined,

		//Chat balloons showing messages above player markers
		chatBalloons: false
	},

	followTarget: undefined,
	panTarget: undefined,

	currentWorld: undefined,
	currentMap: undefined,
	currentLocation: {
		x: 0,
		y: 0,
		z: 0,
	},
	currentZoom: 0,

	currentProjection: new DynmapProjection(), //Projection for converting location <-> latlg. Object itself isn't reactive for performance reasons
	currentWorldState: {
		raining: false,
		thundering: false,
		timeOfDay: 0,
	},

	updateRequestId: 0,
	updateTimestamp: new Date(),

	ui: {
		smallScreen: false,
		visibleElements:new Set(),
	},

	parsedUrl: {
		world: undefined,
		map: undefined,
		location: undefined,
		zoom: undefined,
		legacy: false,
	}
};
