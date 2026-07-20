# Test script for Navigation System API

Write-Host "Testing Navigation System API" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

# Test 1: Get route from Tallahassee to Orlando
Write-Host "`nTest 1: Tallahassee, FL -> Orlando, FL" -ForegroundColor Cyan
$body = @{
    origin = "Tallahassee, FL"
    destination = "Orlando, FL"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/shortest-path" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body
    
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host "   Origin: $($response.origin)"
    Write-Host "   Destination: $($response.destination)"
    if ($response.total_distance_m) {
        Write-Host "   Distance: $([math]::Round($response.total_distance_m / 1000, 2)) km"
    }
    if ($response.total_time_s) {
        Write-Host "   Time: $([math]::Floor($response.total_time_s / 60)) minutes"
    }
    Write-Host "   Route Points: $(($response.coords).Count)"
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Get route from New York to Boston
Write-Host "`nTest 2: New York, NY -> Boston, MA" -ForegroundColor Cyan
$body2 = @{
    origin = "New York, NY"
    destination = "Boston, MA"
} | ConvertTo-Json

try {
    $response2 = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/shortest-path" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body2
    
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host "   Origin: $($response2.origin)"
    Write-Host "   Destination: $($response2.destination)"
    if ($response2.total_distance_m) {
        Write-Host "   Distance: $([math]::Round($response2.total_distance_m / 1000, 2)) km"
    }
    if ($response2.total_time_s) {
        Write-Host "   Time: $([math]::Floor($response2.total_time_s / 60)) minutes"
    }
    Write-Host "   Route Points: $(($response2.coords).Count)"
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n================================" -ForegroundColor Green
Write-Host "Testing complete!" -ForegroundColor Green

