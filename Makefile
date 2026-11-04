.PHONY: dev build test check sop-check validate screenshot

dev:
	npm run dev

build:
	npm run build

test:
	npm test

check:
	npm run check

sop-check:
	npm run sop-check

validate:
	npm run validate

screenshot:
	node scripts/screenshot.mjs --html exports/course-design/deck-16x9.html --all
