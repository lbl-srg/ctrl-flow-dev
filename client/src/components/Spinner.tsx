import "../styles/components/spinner.scss";

export interface SpinnerProps {
	loading: boolean;
	text: string;
}

function Spinner({ loading, text }: SpinnerProps) {
	console.log('spinner loading: ', loading);
	if (!loading) return null;

	return (
		<div className="loader-container">
			<div className="loader"></div>
			<div className="loader-text">
				{text}
			</div>
		</div>
	);
}

export default Spinner;
