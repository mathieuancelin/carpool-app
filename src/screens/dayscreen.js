import React from 'react';
import moment from 'moment';
import DriverButton from '../components/driverbutton';
import * as Actions from '../actions/actions';
import Hammer from 'hammerjs';

export default React.createClass({

  getInitialState() {
    return {
      changed: false,
      date: moment(),
      users: [],
      userStates: {},
      minScore: -10000,
      alreadyValidated: false
    };
  },

  update() {
    const fromArchives = this.props.store.getCurrentDayFromArchive();
    const alreadyValidated = this.props.store.isAlreadyValidated();
    const date = this.props.store.getCurrentDate();
    const rawusers = this.props.store.getUsers();
    const users = Object.keys(rawusers).map(k => rawusers[k]);
    const scores = users.map(u => u.score);
    const minScore = Math.min(...scores);
    const userStates = {};
    let driver = 'Nobody';
    if (alreadyValidated) {
      for (let key in fromArchives) {
        userStates[key] = fromArchives[key].role;
        if (userStates[key] === 'driver') {
          driver = rawusers[key].name;
        }
      }
    } else {
      for (let key in users) {
        let user = users[key];
        userStates[user.id] = 'pooler';
      }
    }
    let changed = this.state.changed;
    if (!date.isSame(this.state.date)) {
      changed = false;
    }
    this.setState({ date, users, alreadyValidated, userStates, minScore, driver, changed });
  },

  swipe(ev) {
    if (ev.direction === Hammer.DIRECTION_LEFT) {
      this.nextDay();
    }
    if (ev.direction === Hammer.DIRECTION_RIGHT) {
      this.previousDay();
    }
  },

  previousDay() {
    this.props.store.dispatch(Actions.previousDay());
  },

  nextDay() {
    this.props.store.dispatch(Actions.nextDay());
  },

  componentDidMount() {
    this.subscription = this.props.store.subscribe(this.update);
    this.hammer = new Hammer(document.body);
    this.hammer.on('swipe', this.swipe);
    this.update();
  },

  componentWillUnmount() {
    this.subscription();
    this.hammer.off('swipe', this.swipe);
  },

  validate() {
    this.props.store.dispatch(Actions.updateDay({
      users: this.state.users,
      userStates: this.state.userStates,
    }));
    this.setState({ changed: false })
  },

  globalToggle({ carpooler, state }) {
    let driver;
    let states = {...this.state.userStates};
    for (let key in states) {
      let value = states[key];
      if (state === 'driver' && value === 'driver' && key !== carpooler.id) {
        states[key] = 'pooler';
      }
      if (states[key] === 'driver') {
        driver = this.state.users[key];
      }
    }
    if (state === 'driver') {
      driver = carpooler;
    }
    states[carpooler.id] = state;
    this.setState({ userStates: states, changed: true, driver: driver ? driver.name : 'Nobody' });
  },
  render() {
    const fromArchives = this.props.store.getCurrentDayFromArchive();
    const isAlreadyValidated = this.props.store.isAlreadyValidated();
    const buttonClass = isAlreadyValidated ? 'btn btn-positive' : 'btn btn-negative';
    const isInPast = this.props.store.isInPast();
    const driverStates = this.state.userStates;
    return (
      <div>
        <header className="bar bar-nav">
          <button className="btn btn-link btn-nav pull-left" onClick={this.previousDay}>
            <span className="icon icon-left-nav"></span>
            Prev.
          </button>
          <button className="btn btn-link btn-nav pull-right" onClick={this.nextDay}>
            Next
            <span className="icon icon-right-nav"></span>
          </button>
          <h1 className="title">{this.state.date.format('dddd DD MMMM YYYY')}</h1>
        </header>
        <div className="content">
          <ul className="table-view" style={{ borderBottom: 'none' }}>
            {this.state.users
                .map(user => <DriverButton
                  key={user.email}
                  minScore={this.state.minScore}
                  inPast={isInPast}
                  onChange={this.globalToggle}
                  driverState={driverStates[user.id]}
                  carpooler={user} />)}
            <li onClick={this.toggle}  style={{ borderBottom: 'none' }} className="table-view-cell">
              {
                isAlreadyValidated
                ? (this.state.changed ? <p>{`${this.state.driver} will be the driver after update`}</p> : <p>{`${this.state.driver} is the driver for that day`}</p>)
                : <span dangerouslySetInnerHTML={{ __html: '&nbsp;' }}></span>
              }
              <br/>
              {
                isAlreadyValidated
                ? this.state.changed ? <button style={{ fontSize: 18, fontWeight: 400 }} className={buttonClass} onClick={this.validate}>Update</button> : <span></span>
                : <button style={{ fontSize: 18, fontWeight: 400 }} className={buttonClass} onClick={this.validate}>Save</button>
              }
            </li>
            <li onClick={this.toggle} className="table-view-cell" style={{ borderBottom: 'none' }}>
              <span dangerouslySetInnerHTML={{ __html: '&nbsp;' }}></span>
            </li>
          </ul>
        </div>
      </div>
    );
  }
});
