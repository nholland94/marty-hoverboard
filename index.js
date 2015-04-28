var path = require('path');
var pkg = require(path.join(__dirname, 'package.json'));
var Handlebars = require('handlebars');
var pluralize = require('pluralize');
var FileHelpers = require(path.join(__dirname+'/lib/', 'file_helpers'));

var merge = function(base) {
  var otherObjects = arguments.splice(0, 1);
  for(var i in otherObjects) {
    var otherObject = otherObjects[i];
    for(var key in otherObject) {
      base[key] = otherObject[key];
    }
  }
  return base;
};

var fail = function(failureMessage) {
  console.error(failureMessage);
  process.exit(1);
};

var capitalizeFirstLetter = function(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

var isCapitalized = function(character) {
  return character === character.toUpperCase();
};

var underscoreModelName = function(modelName) {
  return modelName.split(/(?=[A-Z])/).join('_');
};

var modelContext = function(modelName) {
  if(!isCapitalized(modelName.charAt(0))) {
    fail('Model name must be in CamelCase');
  }

  var underscoredName = underscoreModelName(modelName).toUpperCase();
  var underscoredPluralName = underscoreModelName(pluralize(modelName)).toUpperCase();
  return {
    modelName: modelName,
    pluralModelName: pluralize(modelName),
    modelVariableName: capitalizeFirstLetter(modelName),
    pluralModelVariableName: pluralize(capitalizeFirstLetter(modelName)),
    constantsName: modelName + 'Constants',
    receiveModelConstant: 'RECEIVE_' + underscoredPluralName,
    addModelConstant: 'ADD_' + underscoredName,
    updateModelConstant: 'UPDATE_' + underscoredName,
    removeModelConstant: 'REMOVE_' + underscoredName,
    storeName: modelName + 'Store',
    stateName: modelName + 'State'
  };
};

var generateTemplateOutput = function(modelName, templatePath) {
  var context = modelContext(modelName);
  var templateText = FileHelpers.getTemplateText(templatePath);

  var template = Handlebars.compile(templateText);
  return template(context);
};

var generateStore = function(modelName) {
  console.log('Creating %s store ...', modelName);
  var output = generateTemplateOutput(modelName, './templates/store.tmpl');

  var fileName = modelName + 'Store.jsx';
  console.log("Writing file '%s' ...", fileName);

  FileHelpers.writeFile(fileName, output);

  console.log('%s store created successfully.', modelName);
};

var generateConstants = function(modelName) {
  console.log('Creating %s constants ...', modelName);
  var output = generateTemplateOutput(modelName, './templates/constants.tmpl');

  var fileName = modelName + 'Constants.jsx';
  console.log('Writing file "%s" ...', fileName);

  FileHelpers.writeFile(fileName, output);

  console.log('%s constants created successfully.', modelName);
};

var SourceGenerators = {
  http: function(modelName) {

  }
};

var generateSource = function(sourceType, modelName) {
  if(!(sourceType in SourceGenerators)) {
    fail('Sorry, but only the http source is supported right now');
  }

  SourceGenerators[sourceType](modelName);
};

var generateComponent = function(modelName) {
  console.log('Creating %s component...', modelName);
  var output = generateTemplateOutput(modelName, './templates/component.tmpl');

  var fileName = modelName + '.jsx';
  console.log("Writing file '%s' ...", fileName);

  FileHelpers.writeFile(fileName, output);

  console.log('%s component created successfully.', modelName);
};

var program = require('commander');

program.version(pkg.version);

program
  .command('component <modelName>')
  .description('Generate a component.')
  .action(generateComponent);

program
  .command('constants <modelName>')
  .description('Generate constants for a model.')
  .action(generateConstants);

program
  .command('source <sourceType> <modelName>')
  .description('Generate a source of the specified type.')
  .action(generateSource);

program
  .command('store <modelName>')
  .description('Generate a store and state mixin.')
  .action(generateStore);



program.parse(process.argv);
