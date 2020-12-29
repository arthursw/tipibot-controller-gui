module.exports = {
  entry: './ts/Main.ts',
  output: {
    filename: 'bundle.js',
    path: __dirname
  },
  target: "web",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
      },
      { test: /\.css$/, use: ["style-loader", "css-loader"], },
    ]
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"]
  },
  watch: true
};