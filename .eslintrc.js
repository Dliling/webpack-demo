/**
 * @file eslint config
 * @author
 * @doc https: //eslint.bootcss.com/docs/user-guide/configuring
 */
module.exports = {
    parser: 'babel-eslint',
    // 继承哪个规则
    // extends: '',
    rules: {
        semi: 'warn'
    },
    env: {
        brower: true,
        node: true
    }
};
