/**
 * @file webpack config
 * @author
 */
const path = require('path');
const webpack = require('webpack');
const glob = require('glob');
// html压缩
const HtmlWebpackPlugin = require('html-webpack-plugin');
// 清理构建产物,新版这样按需引入，不能直接引入
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');

const setMPA = () => {
    const entry = {};
    const htmlWebpackPlugins = [];

    const entryFiles = glob.sync(path.join(__dirname, './src/*/index.js'));
    Object.keys(entryFiles).map(index => {
        const entryFile = entryFiles[index];
        const match = entryFile.match(/src\/(.*)\/index\.js/);
        const pageName = match && match[1];
        entry[pageName] = entryFile;
        const htmlWebpackPlugin = new HtmlWebpackPlugin({
            template: path.join(__dirname, `src/${pageName}/index.html`),
            filename: `${pageName}.html`,
            // 使用chunk
            chunks: [pageName],
            // 打包出的chunk自动注入
            inject: true,
            minify: {
                html5: true,
                // 删除空格和换行符，若preserveLineBreaks参数设为true，则保留了换行符
                collapseWhitespace: true,
                preserveLineBreaks: false,
                minifyCSS: true,
                minifyJS: true,
                removeComments: false
            }
        });
        htmlWebpackPlugins.push(htmlWebpackPlugin);
    });
    return {
        entry,
        htmlWebpackPlugins
    };
};

const {
    entry,
    htmlWebpackPlugins
} = setMPA();

module.exports = {
    // entry: {
    //     index: './src/index.js',
    //     search: './src/search.js'
    // },
    entry: entry,
    output: {
        filename: '[name].js',
        path: path.join(__dirname, 'dist')
    },
    // watch: true,
    mode: 'development',
    module: {
        rules: [
            {
                test: /\.js$/,
                use: 'babel-loader'
            },
            {
                test: /\.css$/,
                use: [
                    'style-loader', // 链式调用，从右到左
                    'css-loader'
                ]
            },
            {
                test: /\.less$/,
                use: [
                    'style-loader', // 链式调用，从右到左
                    'css-loader',
                    'less-loader'
                ]
            },
            // {
            //     test: /\.(png|jpg|gif|jpeg)$/,
            //     use: [
            //         'file-loader'
            //     ]
            // },
            {
                test: /\.(png|svg|gif|jpg|jpeg)$/,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            limit: 10240 // B
                        }
                    }
                ]
            },
            {
                test: /\.(otf|woff2|eot|ttf|woff)$/,
                use: [
                    'file-loader'
                ]
            }
        ]
    },
    plugins: [
        // 热更新
        new webpack.HotModuleReplacementPlugin(),
        new CleanWebpackPlugin(),
        new FriendlyErrorsWebpackPlugin()
    ].concat(htmlWebpackPlugins),
    devServer: {
        contentBase: './dist/',
        hot: true,
        stats: 'errors-only'
    }
};
