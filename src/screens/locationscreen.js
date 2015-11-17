import React from 'react';
import moment from 'moment';
import * as Actions from '../actions/actions';

const locations = ['SERLI', 'POITIERS NORD', 'POITIERS SUD'];

export default React.createClass({
  getInitialState() {
    return {
      location: locations[0],
      at: '07:53:00'
    };
  },
  update() {
    this.setState({ location: this.props.store.getCurrentLocation(), at: this.props.store.getCurrentTime() });
  },
  componentDidMount() {
    this.props.store.setNow();
    this.cancelSubscription = this.props.store.subscribe(this.update);
    this.update();
  },
  componentWillUnmount() {
    this.cancelSubscription();
    this.props.store.setNow();
  },
  select(location) {
    return () => {
      this.setState({ location });
      this.props.store.dispatch(Actions.changeLocation(location));
    };
  },
  changeDate(e) {
    this.setState({ at: e.target.value });
    this.props.store.dispatch(Actions.changeTime(e.target.value));
  },
  render() {
    return (
      <div>
        <header className="bar bar-nav">
          <h1 className="title">Location</h1>
        </header>
        <div className="content">
          <div className="card">
            <ul className="table-view">
              {locations.map(l => <li key={l} className="table-view-cell" onClick={this.select(l)} style={{ backgroundColor: this.state.location === l ? '#ECECEC' : 'white' }}>{l}</li>)}
            </ul>
          </div>
          <div className="card">
            <ul className="table-view">
              <li className="table-view-cell" style={{ backgroundColor: '#D6EEFF' }}>Time</li>
              <li className="table-view-cell" style={{ height: 60, paddingLeft: 10, paddingRight: 10 }}>
                <input type="time" onChange={this.changeDate} value={this.state.at} style={{ width: '100%', height: 35, paddingLeft: 10, paddingRight: 10 }} />
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }
});
