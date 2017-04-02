# Make sure the Apt package lists are up to date, so we're downloading versions that exist.
cookbook_file "apt-sources.list" do
  path "/etc/apt/sources.list"
end

execute 'apt_update' do
  command 'apt-get update'
end

# Base configuration recipe in Chef.
package "wget"

package "bcrypt"

package "ntp"
cookbook_file "ntp.conf" do
  path "/etc/ntp.conf"
end
execute 'ntp_restart' do
  command 'service ntp restart'
end

# Install nginx via apt-get
package "nginx"
# Override the default nginx config with the one in our cookbook.
cookbook_file "nginx-default" do
  path "/etc/nginx/sites-available/default"
end
# Reload nginx to pick up new nginx config
service "nginx" do
  action :reload
end

mysql_service 'mysql' do
  port '3306'
  version '5.7'
  initial_root_password 'hello'
  action [:create, :start, :restart]
end

# Populate the DB
execute "create_db" do
  cwd "/home/ubuntu/project/web-app/app"
  command "mysql -uroot -phello -h127.0.0.1 < create.sql"
end

###NodeJS
# Add repository so apt-get can install latest Node from NodeSource
execute "add_nodesource_repo" do
  command "curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -"
end
 
# Install node.js
package "nodejs"

# Install package dependencies and run npm install
execute "npm_install" do
  cwd "/home/ubuntu/project/web-app/app"
  command "npm install --no-bin-links"
end
###END NodeJS


###Begin game app

# Populate the DB
execute "populate_db" do
  cwd "/home/ubuntu/project/web-app/app"
  command "node populateDb.js -q ./src/questions/questions.json"
end

# Add a service file for running the music app on startup
cookbook_file "gameapp.service" do
    path "/etc/systemd/system/gameapp.service"
end
 
# Start the music app
execute "start_gameapp" do
    command "sudo systemctl start gameapp"
end
 
# Start music app on VM startup
execute "startup_gameapp" do
    command "sudo systemctl enable gameapp"
end