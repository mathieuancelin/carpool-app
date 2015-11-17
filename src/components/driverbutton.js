import React from 'react';
import Utils from '../utils';
import moment from 'moment';

const messages = {
  pooler: 'Ne conduis pas',
  driver: 'Conduis',
  solo: 'En solo'
};
const styles = {
  pooler: 'btn-primary',
  driver: 'btn-positive',
  solo: 'btn-negative'
};
const images = {
  pooler: '/images/pooler.png',
  driver: '/images/driver.png',
  solo: '/images/solo.png'
};
const states = ['pooler', 'solo', 'driver'];

const Styles = {
  name: {
    position: 'absolute',
    top: '50%',
    left: 80,
    WebkitTransform: 'translateY(-50%)',
    MsTransform: 'translateY(-50%)',
    transform: 'translateY(-50%)',
  }
};

export default React.createClass({
  getInitialState() {
    return {
      message: 0
    };
  },
  getDefaultProps() {
    return {
      driverState: 'pooler',
      onChange: () => Utils.Unit
    };
  },
  toggle() {
    const newMessage = (this.state.message + 1) % states.length;
    this.setState({ message: newMessage }, () => {
      const payload = { carpooler: this.props.carpooler, state: states[this.state.message] };
      this.props.onChange(payload);
    });
  },
  componentDidMount() {
    // console.log('for user', this.props.carpooler.name, 'state is', this.props.driverState);
    this.setState({ message: states.indexOf(this.props.driverState) });
  },
  render() {
    const badgeClass = this.props.carpooler.score === this.props.minScore ? 'badge badge-negative' : 'badge';
    return (
      <li onClick={this.toggle} className="table-view-cell"
          style={{ backgroundColor: this.props.driverState === 'driver' ? '#ECECEC' : 'white' }}>
        <img src={images[this.props.driverState]} width={60} height={60} />
        <span style={Styles.name}>{this.props.carpooler.name} ({this.props.driverState})</span>
        {
          this.props.inPast
          ? <span></span>
          : <span className={badgeClass}>{this.props.carpooler.score.toFixed(2)}</span>
        }
      </li>
    );
  }
});
