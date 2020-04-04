/**
 * @file webpack config
 * @author
 */
const path = require('path');
const webpack = require('webpack');
const glob = require('glob');
// 将CSS抽离成单独文件
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
// css压缩
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
// html压缩
const HtmlWebpackPlugin = require('html-webpack-plugin');
// 清理构建产物，新版按需引入，不能直接引入
// TypeError: CleanWebpackPlugin is not a constructor
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
// 基础库不打包，直接CDN引入
const HtmlWebpackExternalsPlugin = require('html-webpack-externals-plugin');
// 构建日志优化提示
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
            chunks: ['vendors', pageName],
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

const {entry, htmlWebpackPlugins} = setMPA();

module.exports = {
    // entry: {
    //     index: './src/index.js',
    //     search: './src/search.js'
    // },
    entry: entry,
    output: {
        filename: '[name]_[chunkhash:8].js',
        path: path.join(__dirname, 'dist')
    },
    mode: 'none',
    module: {
        rules: [
            {
                test: /\.js$/,
                use: [
                    'babel-loader',
                    'eslint-loader'
                ]
            },
            {
                test: /\.css$/,
                use: [
                    MiniCssExtractPlugin.loader, // 和style-loader互斥
                    // 'style-loader', // 创建style标签，链式调用，从右到左
                    'css-loader'
                ]
            },
            {
                test: /\.less$/,
                use: [
                    MiniCssExtractPlugin.loader, // 和style-loader互斥
                    // 'style-loader', // 创建style标签，链式调用，从右到左
                    'css-loader',
                    'less-loader',
                    {
                        loader: 'postcss-loader',
                        options: {
                            plugins: () => [
                                // 浏览器支持版本控制在package.json browserslist
                                require('autoprefixer')()
                            ]
                        }
                    },
                    {
                        loader: 'px2rem-loader',
                        options: {
                            // 1rem = 75px
                            remUnit: 75,
                            // 小数点位数
                            remPrecesion: 8
                        }
                    }
                ]
            },
            {
                test: /\.(png|jpg|gif|jpeg)$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name: '[name]_[hash:8].[ext]'
                        }
                    }
                ]
            },
            // {
            //     test: /\.(png|svg|gif|jpg|jpeg)$/,
            //     use: [
            //         {
            //                 // 内联在代码中
            //             loader: 'url-loader',
            //             options: {
            //                 limit: 10240 // B
            //             }
            //         }
            //     ]
            // },
            {
                test: /\.(otf|woff2|eot|ttf|woff)$/,
                use: [
                    'file-loader'
                ]
            }
        ]
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: '[name]_[contenthash:8].css'
        }),
        new OptimizeCSSAssetsPlugin({
            assetNameRegExp: /\.css$/g,
            cssProcessor: require('cssnano')
        }),
        // 一个页面对应一个
        // new HtmlWebpackPlugin({
        //     template: path.join(__dirname, 'src/index.html'),
        //     filename: 'search.html',
        //     // 使用chunk,与注入的打包好的文件名对应
        //     chunks: ['search'],
        //     // 打包出的chunk自动注入
        //     inject: true,
        //     minify: {
        //         html5: true,
        //         // 删除空格和换行符，若preserveLineBreaks参数设为true，则保留了换行符
        //         collapseWhitespace: true,
        //         preserveLineBreaks: false,
        //         minifyCSS: true,
        //         minifyJS: true,
        //         removeComments: false
        //     }
        // }),
        new CleanWebpackPlugin(),
        // 基础库提取
        // new HtmlWebpackExternalsPlugin({
        //     externals: [
        //         {
        //             module: 'react',
        //             entry: 'https://11.url.cn/now/lib/16.2.0/react.min.js',
        //             global: 'React'
        //         },
        //         {
        //             module: 'react-dom',
        //             entry: 'https://11.url.cn/now/lib/16.2.0/react-dom.min.js',
        //             global: 'ReactDOM'
        //         }
        //     ]
        // }),
        // scope hoisting 减少闭包
        new webpack.optimize.ModuleConcatenationPlugin(),
        new FriendlyErrorsWebpackPlugin(),
        // 捕获错误处理
        function () {
            // v3.0版本
            // this.plugin('done', (stats) => {
            // v4.0
            this.hooks.done.tap('done', stats => {
                if (stats.compilation.errors && stats.compilation.errors.length && process.argv.indexOf('--watch') === -1) {
                    console.log('build error');
                    process.exit(1);
                }
            });
        }
    ].concat(htmlWebpackPlugins),
    optimization: {
        // 提取公共包
        splitChunks: {
            // 分离包的最小体积
            minSize: 0,
            cacheGroups: {
                commons: {
                    // 分离基础库
                    // 匹配出需要分离的包
                    // test: /(react|react-dom)/,
                    // name: 'vendors',
                    // chunks: 'all'
                    name: 'commons',
                    chunks: 'all',
                    // 最少引用次数
                    minChunks: 2
                }
            }
        }
    },
    stats: 'errors-only'
};
