module.exports = (function memQueue() {

  // private key value state
  /**
   * {
   *    key1: [value1, value2, ...valueN], 
   *    key2: [value1, value2, ...valueN], 
   * }
   */

  const _state = {};

  function push(key, value) {
    if (!exists(key)) { 
      _state[key] = [value];
    } else {
      _state[key].push(value);
    }
  }

  function get(key) {
    return _state[key];
  }

  function getAll() {
    return _state;
  }

  function exists(key) {
    return Object.keys(_state).includes(key);
  }

  function remove(key) {
    delete _state[key];
  }

  // exposed pubic API 
  return {
    push,
    get,
    getAll,
    exists,
    remove,
  }

})();