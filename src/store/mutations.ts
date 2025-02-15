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

import {MutationTree} from "vuex";
import {MutationTypes} from "@/store/mutation-types";
import {State} from "@/store/state";
import {
	DynmapArea,
	DynmapCircle,
	DynmapComponentConfig,
	DynmapLine, Coordinate,
	DynmapMarker,
	DynmapMarkerSet,
	DynmapMarkerSetUpdates,
	DynmapMessageConfig,
	DynmapPlayer,
	DynmapServerConfig, DynmapTileUpdate,
	DynmapWorld,
	DynmapWorldState, DynmapParsedUrl, DynmapChat, DynmapUIElement
} from "@/dynmap";
import {DynmapProjection} from "@/leaflet/projection/DynmapProjection";

export type CurrentMapPayload = {
	worldName: string;
	mapName: string;
}

export type Mutations<S = State> = {
	[MutationTypes.SET_CONFIGURATION](state: S, config: DynmapServerConfig): void
	[MutationTypes.SET_MESSAGES](state: S, messages: DynmapMessageConfig): void
	[MutationTypes.SET_WORLDS](state: S, worlds: Array<DynmapWorld>): void
	[MutationTypes.SET_COMPONENTS](state: S, worlds: DynmapComponentConfig): void
	[MutationTypes.SET_MARKER_SETS](state: S, worlds: Map<string, DynmapMarkerSet>): void
	[MutationTypes.ADD_WORLD](state: S, world: DynmapWorld): void
	[MutationTypes.SET_WORLD_STATE](state: S, worldState: DynmapWorldState): void
	[MutationTypes.SET_UPDATE_TIMESTAMP](state: S, time: Date): void
	[MutationTypes.ADD_MARKER_SET_UPDATES](state: S, updates: Map<string, DynmapMarkerSetUpdates>): void
	[MutationTypes.ADD_TILE_UPDATES](state: S, updates: Array<DynmapTileUpdate>): void
	[MutationTypes.ADD_CHAT](state: State, chat: Array<DynmapChat>): void

	[MutationTypes.POP_MARKER_UPDATES](state: S, payload: {markerSet: string, amount: number}): void
	[MutationTypes.POP_AREA_UPDATES](state: S, payload: {markerSet: string, amount: number}): void
	[MutationTypes.POP_CIRCLE_UPDATES](state: S, payload: {markerSet: string, amount: number}): void
	[MutationTypes.POP_LINE_UPDATES](state: S, payload: {markerSet: string, amount: number}): void
	[MutationTypes.POP_TILE_UPDATES](state: S, amount: number): void

	[MutationTypes.INCREMENT_REQUEST_ID](state: S): void
	[MutationTypes.SET_PLAYERS_ASYNC](state: S, players: Set<DynmapPlayer>): Set<DynmapPlayer>
	[MutationTypes.SYNC_PLAYERS](state: S, keep: Set<string>): void
	[MutationTypes.SET_CURRENT_MAP](state: S, payload: CurrentMapPayload): void
	[MutationTypes.SET_CURRENT_PROJECTION](state: S, payload: DynmapProjection): void
	[MutationTypes.SET_CURRENT_LOCATION](state: S, payload: Coordinate): void
	[MutationTypes.SET_CURRENT_ZOOM](state: S, payload: number): void
	[MutationTypes.SET_PARSED_URL](state: S, payload: DynmapParsedUrl): void
	[MutationTypes.SET_FOLLOW_TARGET](state: S, payload: DynmapPlayer): void
	[MutationTypes.SET_PAN_TARGET](state: S, payload: DynmapPlayer): void
	[MutationTypes.CLEAR_FOLLOW_TARGET](state: S, a?: void): void
	[MutationTypes.CLEAR_PAN_TARGET](state: S, a?: void): void

	[MutationTypes.SET_SMALL_SCREEN](state: S, payload: boolean): void
	[MutationTypes.TOGGLE_UI_ELEMENT_VISIBILITY](state: S, payload: DynmapUIElement): void
	[MutationTypes.SET_UI_ELEMENT_VISIBILITY](state: S, payload: {element: DynmapUIElement, state: boolean}): void
}

export const mutations: MutationTree<State> & Mutations = {
	// Sets configuration options from the initial config fetch
	[MutationTypes.SET_CONFIGURATION](state: State, config: DynmapServerConfig) {
		state.configuration = Object.assign(state.configuration, config);
	},

	//Set messsages from the initial config fetch
	[MutationTypes.SET_MESSAGES](state: State, messages: DynmapMessageConfig) {
		state.messages = Object.assign(state.messages, messages);
	},

	//Sets the list of worlds, and their settings, from the initial config fetch
	[MutationTypes.SET_WORLDS](state: State, worlds: Array<DynmapWorld>) {
		state.worlds.clear();
		state.maps.clear();

		state.currentMap = undefined;
		state.currentWorld = undefined;
		state.followTarget = undefined;
		state.panTarget = undefined;

		state.currentWorldState.timeOfDay = 0;
		state.currentWorldState.raining = false;
		state.currentWorldState.thundering = false;

		worlds.forEach(world => {
			state.worlds.set(world.name, world);
			world.maps.forEach(map => state.maps.set([world.name, map.name].join('_'), map));
		});
	},

	//Sets the state and settings of optional components, from the initial config fetch
	[MutationTypes.SET_COMPONENTS](state: State, components: DynmapComponentConfig) {
		state.components = components;
	},

	//Sets the existing marker sets from the last marker fetch
	[MutationTypes.SET_MARKER_SETS](state: State, markerSets: Map<string, DynmapMarkerSet>) {
		state.markerSets = markerSets;
		state.pendingSetUpdates.clear();

		for(const entry of markerSets) {
			state.pendingSetUpdates.set(entry[0], {
				markerUpdates: [],
				areaUpdates: [],
				circleUpdates: [],
				lineUpdates: [],
			});
		}
	},

	[MutationTypes.ADD_WORLD](state: State, world: DynmapWorld) {
		state.worlds.set(world.name, world);
	},

	//Sets the current world state an update fetch
	[MutationTypes.SET_WORLD_STATE](state: State, worldState: DynmapWorldState) {
		state.currentWorldState = Object.assign(state.currentWorldState, worldState);
	},

	//Sets the timestamp of the last update fetch
	[MutationTypes.SET_UPDATE_TIMESTAMP](state: State, timestamp: Date) {
		state.updateTimestamp = timestamp;
	},

	//Adds markerset related updates from an update fetch to the pending updates list
	[MutationTypes.ADD_MARKER_SET_UPDATES](state: State, updates: Map<string, DynmapMarkerSetUpdates>) {
		for(const entry of updates) {
			if(!state.markerSets.has(entry[0])) {

				//Create marker set if it doesn't exist
				if(entry[1].payload) {
					state.markerSets.set(entry[0], {
						id: entry[0],
						showLabels: entry[1].payload.showLabels,
						minZoom: entry[1].payload.minZoom,
						maxZoom: entry[1].payload.maxZoom,
						priority: entry[1].payload.priority,
						label: entry[1].payload.label,
						hidden: entry[1].payload.hidden,
						markers: Object.freeze(new Map()) as Map<string, DynmapMarker>,
						areas: Object.freeze(new Map()) as Map<string, DynmapArea>,
						circles: Object.freeze(new Map()) as Map<string, DynmapCircle>,
						lines: Object.freeze(new Map()) as Map<string, DynmapLine>,
					});

					state.pendingSetUpdates.set(entry[0], {
						markerUpdates: [],
						areaUpdates: [],
						circleUpdates: [],
						lineUpdates: [],
					});
				} else {
					console.warn(`ADD_MARKER_SET_UPDATES: Marker set ${entry[0]} doesn't exist`);
					continue;
				}
			}

			const set = state.markerSets.get(entry[0]) as DynmapMarkerSet,
				setUpdates = state.pendingSetUpdates.get(entry[0]) as DynmapMarkerSetUpdates;

			//Delete the set if it has been deleted
			if(entry[1].removed) {
				state.markerSets.delete(entry[0]);
				state.pendingSetUpdates.delete(entry[0]);
				continue;
			}

			//Update the set itself if a payload exists
			if(entry[1].payload) {
				set.showLabels = entry[1].payload.showLabels;
				set.minZoom = entry[1].payload.minZoom;
				set.maxZoom = entry[1].payload.maxZoom;
				set.priority = entry[1].payload.priority;
				set.label = entry[1].payload.label;
				set.hidden = entry[1].payload.hidden;
			}

			//Update non-reactive lists
			for(const update of entry[1].markerUpdates) {
				if(update.removed) {
					set.markers.delete(update.id);
				} else {
					set.markers.set(update.id, update.payload as DynmapMarker);
				}
			}

			for(const update of entry[1].areaUpdates) {
				if(update.removed) {
					set.areas.delete(update.id);
				} else {
					set.areas.set(update.id, update.payload as DynmapArea);
				}
			}

			for(const update of entry[1].circleUpdates) {
				if(update.removed) {
					set.circles.delete(update.id);
				} else {
					set.circles.set(update.id, update.payload as DynmapCircle);
				}
			}

			for(const update of entry[1].lineUpdates) {
				if(update.removed) {
					set.lines.delete(update.id);
				} else {
					set.lines.set(update.id, update.payload as DynmapLine);
				}
			}

			//Add to reactive pending updates lists
			setUpdates.markerUpdates = setUpdates.markerUpdates.concat(entry[1].markerUpdates);
			setUpdates.areaUpdates = setUpdates.areaUpdates.concat(entry[1].areaUpdates);
			setUpdates.circleUpdates = setUpdates.circleUpdates.concat(entry[1].circleUpdates);
			setUpdates.lineUpdates = setUpdates.lineUpdates.concat(entry[1].lineUpdates);
		}
	},

	//Adds tile updates from an update fetch to the pending updates list
	[MutationTypes.ADD_TILE_UPDATES](state: State, updates: Array<DynmapTileUpdate>) {
		state.pendingTileUpdates = state.pendingTileUpdates.concat(updates);
	},

	//Adds chat messages from an update fetch to the chat history
	[MutationTypes.ADD_CHAT](state: State, chat: Array<DynmapChat>) {
		state.chat.messages.unshift(...chat);
	},

	//Pops the specified number of marker updates from the pending updates list
	[MutationTypes.POP_MARKER_UPDATES](state: State, {markerSet, amount}) {
		if(!state.markerSets.has(markerSet)) {
			console.warn(`POP_MARKER_UPDATES: Marker set ${markerSet} doesn't exist`);
			return;
		}

		state.pendingSetUpdates.get(markerSet)!.markerUpdates.splice(0, amount);
	},

	//Pops the specified number of area updates from the pending updates list
	[MutationTypes.POP_AREA_UPDATES](state: State, {markerSet, amount}) {
		if(!state.markerSets.has(markerSet)) {
			console.warn(`POP_AREA_UPDATES: Marker set ${markerSet} doesn't exist`);
			return;
		}

		state.pendingSetUpdates.get(markerSet)!.areaUpdates.splice(0, amount);
	},

	//Pops the specified number of circle updates from the pending updates list
	[MutationTypes.POP_CIRCLE_UPDATES](state: State, {markerSet, amount}) {
		if(!state.markerSets.has(markerSet)) {
			console.warn(`POP_CIRCLE_UPDATES: Marker set ${markerSet} doesn't exist`);
			return;
		}

		state.pendingSetUpdates.get(markerSet)!.circleUpdates.splice(0, amount);
	},

	//Pops the specified number of line updates from the pending updates list
	[MutationTypes.POP_LINE_UPDATES](state: State, {markerSet, amount})  {
		if(!state.markerSets.has(markerSet)) {
			console.warn(`POP_LINE_UPDATES: Marker set ${markerSet} doesn't exist`);
			return;
		}

		state.pendingSetUpdates.get(markerSet)!.lineUpdates.splice(0, amount);
	},

	//Pops the specified number of tile updates from the pending updates list
	[MutationTypes.POP_TILE_UPDATES](state: State, amount: number) {
		state.pendingTileUpdates.splice(0, amount);
	},

	//Increments the request id for the next update fetch
	[MutationTypes.INCREMENT_REQUEST_ID](state: State) {
		state.updateRequestId++;
	},

	// Set up to 10 players at once
	[MutationTypes.SET_PLAYERS_ASYNC](state: State, players: Set<DynmapPlayer>): Set<DynmapPlayer> {
		let count = 0;

		for(const player of players) {
			if(state.players.has(player.account)) {
				const existing = state.players.get(player.account);

				existing!.health = player.health;
				existing!.armor = player.armor;
				existing!.location = Object.assign(existing!.location, player.location);
				existing!.hidden = player.hidden;
				existing!.name = player.name;
				existing!.sort = player.sort;
			} else {
				state.players.set(player.account, {
					account: player.account,
					health: player.health,
					armor: player.armor,
					location: player.location,
					name: player.name,
					sort: player.sort,
					hidden: player.hidden,
				});
			}

			players.delete(player);

			if(++count >= 10) {
				break;
			}
		}

		return players;
	},

	//Removes all players not found in the provided keep set
	[MutationTypes.SYNC_PLAYERS](state: State, keep: Set<string>) {
		for(const [key, player] of state.players) {
			if(!keep.has(player.account)) {
				state.players.delete(key);
			}
		}
	},

	//Sets the currently active map/world
	[MutationTypes.SET_CURRENT_MAP](state: State, {worldName, mapName}) {
		mapName = [worldName, mapName].join('_');

		if(!state.worlds.has(worldName)) {
			throw new RangeError(`Unknown world ${worldName}`);
		}

		if(!state.maps.has(mapName)) {
			throw new RangeError(`Unknown map ${mapName}`);
		}

		const newWorld = state.worlds.get(worldName);

		if(state.currentWorld !== newWorld) {
			state.currentWorld = state.worlds.get(worldName);
			state.markerSets.clear();
			state.pendingSetUpdates.clear();
			state.pendingTileUpdates = [];
		}

		state.currentMap = state.maps.get(mapName);
	},

	//Sets the projection to use for coordinate conversion in the current map
	[MutationTypes.SET_CURRENT_PROJECTION](state: State, projection) {
		state.currentProjection = projection;
	},

	//Sets the current location the map is showing. This is called by the map itself, and calling elsewhere will not update the map.
	[MutationTypes.SET_CURRENT_LOCATION](state: State, payload: Coordinate) {
		state.currentLocation = payload;
	},

	//Sets the current zoom level of the map. This is called by the map itself, and calling elsewhere will not update the map.
	[MutationTypes.SET_CURRENT_ZOOM](state: State, payload: number) {
		state.currentZoom = payload;
	},

	//Sets the result of parsing the current map url, if present and valid
	[MutationTypes.SET_PARSED_URL](state: State, payload: DynmapParsedUrl) {
		state.parsedUrl = payload;
	},

	//Set the follow target, which the map will automatically pan to keep in view
	[MutationTypes.SET_FOLLOW_TARGET](state: State, player: DynmapPlayer) {
		state.followTarget = player;
	},

	//Set the pan target, which the map will immediately pan to once
	[MutationTypes.SET_PAN_TARGET](state: State, player: DynmapPlayer) {
		state.panTarget = player;
	},

	//Clear the follow target
	[MutationTypes.CLEAR_FOLLOW_TARGET](state: State) {
		state.followTarget = undefined;
	},

	//Clear the pan target
	[MutationTypes.CLEAR_PAN_TARGET](state: State) {
		state.panTarget = undefined;
	},

	[MutationTypes.SET_SMALL_SCREEN](state: State, smallScreen: boolean): void {
		if(!state.ui.smallScreen && smallScreen && state.ui.visibleElements.size > 1) {
			state.ui.visibleElements.clear();
		}

		state.ui.smallScreen = smallScreen;
	},

	[MutationTypes.TOGGLE_UI_ELEMENT_VISIBILITY](state: State, element: DynmapUIElement): void {
		const newState = !state.ui.visibleElements.has(element);

		if(newState && state.ui.smallScreen) {
			state.ui.visibleElements.clear();
		}

		newState ? state.ui.visibleElements.add(element) : state.ui.visibleElements.delete(element);
	},

	[MutationTypes.SET_UI_ELEMENT_VISIBILITY](state: State, payload: {element: DynmapUIElement, state: boolean}): void {
		if(payload.state && state.ui.smallScreen) {
			state.ui.visibleElements.clear();
		}

		payload.state ? state.ui.visibleElements.add(payload.element) : state.ui.visibleElements.delete(payload.element);
	}
}