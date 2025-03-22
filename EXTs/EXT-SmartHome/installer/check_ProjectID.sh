echo "Your SmartHome project_id is: \c"
cat smarthome.json 2>/dev/null | grep -oP '(?<="project_id": ")[^"]*' || {
  echo "smarthome credentials not found!"
}
echo "\n"
