-- Clean up legacy trigger name
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create profile row when a new user signs up
DROP TRIGGER IF EXISTS trg_auth_users_new_user ON auth.users;
CREATE TRIGGER trg_auth_users_new_user
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public._admin_handle_new_user();
