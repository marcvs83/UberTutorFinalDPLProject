import React, { Component, PropTypes } from 'react'
import MessageComposer from './MessageComposer'
import MessageListItem from './MessageListItem'
import Channels from './Channels'
import * as actions from '../actions/actions'
import * as authActions from '../actions/authActions'
import TypingListItem from './TypingListItem'
import { Modal, DropdownButton, MenuItem, Button, Navbar, NavDropdown, Nav, NavItem } from 'react-bootstrap'

export default class Chat extends Component {

  static propTypes = {
    messages: PropTypes.array.isRequired,
    user: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
    channels: PropTypes.array.isRequired,
    activeChannel: PropTypes.string.isRequired,
    typers: PropTypes.array.isRequired,
    socket: PropTypes.object.isRequired
  }
  constructor(props, context) {
    super(props, context)
    this.state = {
      privateChannelModal: false,
      targetedUser: ''
    }
    this.handleSave = this.handleSave.bind(this)
    this.changeActiveChannel = this.changeActiveChannel.bind(this)
    this.handleClickOnUser = this.handleClickOnUser.bind(this)
    this.closePrivateChannelModal = this.closePrivateChannelModal.bind(this)
    this.handleSendDirectMessage = this.handleSendDirectMessage.bind(this)
  }
  componentDidMount() {
    const { socket, user, dispatch } = this.props
    socket.emit('chat mounted', user)
    socket.on('new bc message', msg =>
      dispatch(actions.receiveRawMessage(msg))
    )
    socket.on('typing bc', user =>
      dispatch(actions.typing(user))
    )
    socket.on('stop typing bc', user =>
      dispatch(actions.stopTyping(user))
    )
    socket.on('new channel', channel =>
      dispatch(actions.receiveRawChannel(channel))
    )
    socket.on('receive socket', socketID =>
      dispatch(authActions.receiveSocket(socketID))
    )
    socket.on('receive private channel', channel =>
      dispatch(actions.receiveRawChannel(channel))
    )
  }
  componentDidUpdate() {
    const messageList = this.refs.messageList
    messageList.scrollTop = messageList.scrollHeight
  }
  handleSave(newMessage) {
    const { dispatch } = this.props
    if (newMessage.text.length !== 0) {
      dispatch(actions.createMessage(newMessage))
    }
  }
  changeActiveChannel(channel) {
    const { socket, activeChannel, dispatch } = this.props
    socket.emit('leave channel', activeChannel)
    socket.emit('join channel', channel)
    dispatch(actions.changeChannel(channel))
    dispatch(actions.fetchMessages(channel.name))
  }
  handleClickOnUser(user) {
    this.setState({ privateChannelModal: false, targetedUser: user })
    this.handleSendDirectMessage(user)
  }
  closePrivateChannelModal() {
    event.preventDefault()
    this.setState({privateChannelModal: false})
  }
  handleSendDirectMessage(targetUser = "") {
    const { dispatch, socket, channels, user } = this.props
    let messageUser = targetUser === "" ? this.state.targetedUser : targetUser
    const doesPrivateChannelExist = channels.filter(item => {
      return item.name === (`${messageUser.username}+${user.username}` || `${user.username}+${messageUser.username}`)
    })
    if (user.username !== messageUser.username && doesPrivateChannelExist.length === 0) {
      const newChannel = {
        name: `${messageUser.username}+${user.username}`,
        id: Date.now(),
        private: true,
        between: [messageUser.username, user.username]
      }
      dispatch(actions.createChannel(newChannel))
      this.changeActiveChannel(newChannel)
      socket.emit('new private channel', messageUser.socketID, newChannel)
    }
    if(doesPrivateChannelExist.length > 0) {
      this.changeActiveChannel(doesPrivateChannelExist[0])
    }
    this.setState({ privateChannelModal: false, targetedUser: '' })
  }

  lobby() {
    window.location.reload()
  }

  render() {
    const { messages, socket, channels, activeChannel, typers, dispatch, user, screenWidth} = this.props
    const filteredMessages = messages.filter(message => message.channelID === activeChannel)
    const username = this.props.user.username || ''
    const dropDownMenu = (
      <div style={{'width': '21rem', 'top': '0', alignSelf: 'baseline', padding: '0', margin: '0', order: '1'}}>
        <DropdownButton className="bg-green50" key={1} style={{'width': '21rem'}} id="user-menu"  bsSize="large" bsStyle="primary" title={username}>
          <MenuItem style={{'width': '21rem'}} eventKey="4" onSelect={this.handleSignOut}>Sign out</MenuItem>
        </DropdownButton>
      </div>
    )
    const PrivateMessageModal = (
      <div className="modalWrapper">
        <Modal bsSize="small" key={1} show={this.state.privateChannelModal} onHide={this.closePrivateChannelModal}>
        <Modal.Header>
          {this.state.targetedUser.username}
        </Modal.Header>
        <Modal.Body>
          <Button onClick={this.handleSendDirectMessage.bind(this)}>
            Direct Message
          </Button>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.closePrivateChannelModal.bind(this)}>
            Close
          </Button>
        </Modal.Footer>
        </Modal>
      </div>
    )
    const mobileNav = (
      <Navbar fixedTop style={{background: '#337ab7', color: 'white'}}>
          <span style={{fontSize: '2em'}}>{username}</span>
          <Navbar.Toggle />
        <Navbar.Collapse style={{maxHeight: '100%'}}>
          <Button bsStyle="primary" onSelect={this.handleSignOut}> Sign out
          </Button>
          <section style={{order: '2', marginTop: '1.5em'}}>
            <Channels socket={socket} onClick={this.changeActiveChannel} channels={channels} messages={messages} dispatch={dispatch} />
          </section>
        </Navbar.Collapse>
      </Navbar>
    );
    const bigNav = (
      <div className="nav">
        {dropDownMenu}
        <section style={{order: '2', marginTop: '1.5em'}}>
          <Channels socket={socket} onClick={this.changeActiveChannel} channels={channels} messages={messages} dispatch={dispatch} />
        </section>
      </div>
    );
    let backToLobby = activeChannel === 'Lobby' ? null : (<div className="bg-green50, center"><button onClick={this.lobby} className="btn center">Back To Lobby</button></div>)
    return (
      <div>
        {dropDownMenu}
        {backToLobby}
        <div className="nav">
          
          
          <div className="row">
            <div className="col s4 m3">
              <section style={{order: '2', marginTop: '1.5em'}}>
                <Channels socket={socket} onClick={this.changeActiveChannel} channels={channels} messages={messages} dispatch={dispatch} />
              </section>
            </div>
            <div className="main col s8 m9">
              <header style={{background: '#FFFFFF', color: 'black', flexGrow: '0', order: '0', fontSize: '2.3em', paddingLeft: '0.2em', width: '50em'}}>
                <div>
                {activeChannel}
                </div>
              </header>
              
              <ul style={{wordWrap: 'break-word', margin: '0', overflowY: 'auto', padding: '0', paddingBottom: '1em', flexGrow: '1', order: '1'}} ref="messageList">
                {filteredMessages.map(message =>
                  <MessageListItem handleClickOnUser={this.handleClickOnUser} message={message} key={message.id} />
                )}
              </ul>
              <MessageComposer socket={socket} activeChannel={activeChannel} user={user} onSave={this.handleSave} />
            </div>
          </div>
        </div>
        <footer style={{fontSize: '1em', position: 'fixed', bottom: '0.2em', left: '21.5rem', color: '#000000', width: '100%', opacity: '0.5'}}>
          {typers.length === 1 &&
            <div>
              <span>
                <TypingListItem username={typers[0]} key={1}/>
                <span> is typing</span>
              </span>
            </div>}
          {typers.length === 2 &&
          <div>
            <span>
              <TypingListItem username={typers[0]} key={1}/>
              <span> and </span>
              <TypingListItem username={typers[1]} key={2}/>
              <span> are typing</span>
            </span>
          </div>}
          {typers.length > 2 &&
          <div>
            <span>Several people are typing</span>
          </div>}
        </footer>
      </div>
    )
  }
}

//<Button bsStyle="primary" onSelect={this.handleSignOut}> Sign out </Button>