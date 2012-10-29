# Watch the file system. Re compile when folders change
watch:
	wr "make run" index.js initial.js persist.js todo reflex lib

# Start live reload server used in dev
reload:
	live-reload --uri=./doc --delay=200

# Build example
run:
	browserify-server --bundle index.js -o ./static/bundle.js

# Run http-server to avoid CORS
http:
	browserify-server --server ./static
