.PHONY: test test-model test-payment test-cron test-helper test-coverage test-all

# Run model layer unit tests
test-model:
	go test ./model/... -v -count=1

# Run payment module unit tests
test-payment:
	go test ./payment/... -v -count=1

# Run cron module unit tests
test-cron:
	go test ./cron/... -v -count=1

# Run helper unit tests
test-helper:
	go test ./common/helper/... -v -count=1

# Run all unit tests
test: test-model test-payment test-cron test-helper

# Generate coverage report
test-coverage:
	go test ./model/... ./payment/... ./cron/... ./common/helper/... -coverprofile=coverage.out -count=1
	go tool cover -func=coverage.out | tail -1
	@echo "Full report: go tool cover -html=coverage.out -o coverage.html"

# Run all tests (alias)
test-all: test
