import { TypeName, AbilityName, MoveName, SpeciesName, StatsTable } from '../calc/data/interface';
import { MoveData } from '../raidcalc/interface';

const assetsProlog = "https://raw.githubusercontent.com/theastrogoth/tera-raid-builder/assets/data/"

export function prepareFileName(name: string) {
    return name.replace(' ','-').replace('.','').replace("’", '').replace("'", '').replace(':','').replace('é','e').toLowerCase();
}

export type PokemonData = {
    name:   SpeciesName,
    types:  TypeName[],
    abilities: AbilityName[],
    stats:  StatsTable,
    moves:  {name: MoveName, learnMethod: string}[],
}

export namespace PokedexService {

    export async function getMoveByName(name: string) {
        try {
            const preppedName = prepareFileName(name);
            let response = await fetch(assetsProlog + "moves/" + preppedName + ".json");
            let responseJson = await response.json();
            return responseJson as MoveData;
        } catch(error) {
            console.error(error);
        }
    }

    export async function getPokemonByName(name: string) {
        try {
            const preppedName = prepareFileName(name);
            let response = await fetch(assetsProlog + "pokemon/" + preppedName + ".json");
            let responseJson = await response.json();
            return responseJson as PokemonData;
        } catch(error) {
            console.error(error);
        }
    }
}

export default PokedexService