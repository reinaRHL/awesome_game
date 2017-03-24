# Name of the role should match the name of the file
name "webserver"

# Run list function we mentioned earlier
run_list(
    "recipe[apache2]",
    "recipe[openssl]"
)




# mysql_service 'foo' do
#   port '3306'
#   version '5.5'
#   initial_root_password 'change me'
#   action [:create, :start]
# end