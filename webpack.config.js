const fs = require('fs');
const path = require('path');

function listDeepSync(dir, filelist = []) {
  let files = fs.readdirSync(dir);

  for (const file of files) {
    const filepath = path.join(dir, file);
    const isDir = fs.statSync(filepath).isDirectory();

    if (isDir) {
      filelist = filelist.concat(listDeepSync(path.join(dir, file)));
    } else {
      filelist = [...filelist, filepath];
    }
  }

  return filelist;
}

const entry = listDeepSync('src/lambdas')
  .filter((file) => file.endsWith('.lambda.ts'))
  .reduce(
    (dict, file) => ({
      ...dict,
      [file.replace('.lambda.ts', '').replace('src/lambdas/', '')]: path.join(__dirname, file),
    }),
    {}
  );

module.exports = {
  entry,
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  target: 'node',
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: '[name]/index.js',
    path: path.join(__dirname, 'build'),
    libraryTarget: 'commonjs',
  },
  mode: 'production',
};
