import ActionTypes from './actiontypes';

export function updateDay(payload) {
  return {
    type: ActionTypes.UpdateDay,
    payload
  };
}

export function previousDay() {
  return {
    type: ActionTypes.PreviousDay
  };
}

export function nextDay() {
  return {
    type: ActionTypes.NextDay
  };
}

export function changeLocation(location) {
  return {
    type: ActionTypes.ChangeLocation,
    payload: location
  };
}

export function changeTime(time) {
  return {
    type: ActionTypes.ChangeTime,
    payload: time
  };
}
