export const AuthControls = () => {
    return (
        <div className="auth-controls fixed top-0 right-0 p-2 z-50">
            <div className="flex gap-2">
                <button className="icon-button" title="Register">
                    <span className="material-icons">person_add</span>
                </button>
                <button className="icon-button" title="Login">
                    <span className="material-icons">login</span>
                </button>
                <button className="icon-button hidden" title="Profile">
                    <span className="material-icons">account_circle</span>
                </button>
            </div>
        </div>
    )
}