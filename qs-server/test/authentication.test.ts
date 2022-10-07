import assert from 'assert';
import { axiosUtil, delete_members } from './utils';
import { adminInfo, quidamInfo } from './fixtures';

describe('authentication', function () {
  // eslint-disable-next-line prefer-const
  let memberId: number | null = null, adminToken;
  before(async function () {
    adminToken = await axiosUtil.call('get_token', {
      mail: adminInfo.email, pass: adminInfo.password
    });
    axiosUtil.update('server_data', {smtp_server: 'localhost'}, {
      smtp_port: 1025, smtp_secure: false, smtp_username: 'test', smtp_password: 'test'
    }, adminToken);
  });
  after(async function () { 
    if (memberId)
      await delete_members({ 'quidam': memberId }, adminToken);
  });
  it('authenticates admin and creates accessToken', async function() {
    const member = await axiosUtil.get(
      'members',
      { email: adminInfo.email },
      adminToken
    );
    assert.equal(member.length, 1);
    assert.ok(member, 'Obtained user using adminToken');
  });
  it('creates a new user without confirmation', async function () {
    await axiosUtil.call('create_member', quidamInfo);
    const quidamData = await axiosUtil.get(
      'members',
      { email: quidamInfo.email! },
      adminToken
    );
    assert.equal(quidamData.length, 1);
    assert(quidamData[0].confirmed == false);
    memberId = quidamData[0].id;
  });
  it('obtains a confirmation email', async function () {
    const axios = axiosUtil.axios;
    const messageSearch = await axios.get('http://localhost:8025/api/v2/search', {
      params: {
        kind: 'to',
        query: quidamInfo.email
      }});
    assert.notEqual(messageSearch.data.total, 0);
    
    // TODO: Use a mock smtp server, probably https://github.com/mailhog/MailHog
  });
  it('uses the confirmation link', async function () {
    // TODO: use the confirmation link on postgres, call confirm_member_email with token
    // check that the confirmed flag was set, and probably also last-login
  });
  it('ask for a reset password', async function () {
    // TODO: ask for a password reset. We should get an email with token.
  });
  it('ask for a second reset password', async function () {
    // TODO: ask for a second password reset immediately. Should fail.
  });
  it('login with email token', async function () {
    // TODO: login using the token obtained from first password reset as parameter
    // obtain a normal (header) token back.
  });
  it('change password', async function () {
    // TODO: change password. try logging in with new password
  });
  it('cannot login with old email token', async function () {
    // TODO: try to login using the old token obtained from password reset
    // expect fail
  });
});
