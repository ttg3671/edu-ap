import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaVideo, FaExclamationCircle } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import UploadForm from '../components/UploadForm';
import useAxiosPrivate from '../hooks/useAxiosPrivate';

const UploadVideo = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [errMsg, setErrMsg] = useState("");
    const [initialData, setInitialData] = useState(null);

    const axiosPrivate = useAxiosPrivate();
    const navigate = useNavigate();
    const { id } = useParams(); // 'id' here is the lesson_id

    useEffect(() => {
        const fetchVideoData = async () => {
            try {
                setIsLoading(true);
                const response = await axiosPrivate.get(`/api/v1/admin/video/${id}`);
                // console.log(response.data);
                if (response.data?.isSuccess && response.data?.data) {
                    setInitialData(response.data.data);
                }
            } catch (err) {
                console.error("Failed to fetch video data", err);
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchVideoData();
        }
    }, [id, axiosPrivate]);

    const handleSubmit = async (lesson_id, video_provider_id, ui_style) => {
        setIsLoading(true);
        setErrMsg("");

        try {
            const response = await axiosPrivate.post("/api/v1/admin/video", {
                lesson_id: parseInt(lesson_id),
                video_provider_id: video_provider_id,
                ui_style: ui_style
            });

            if (response.data?.isSuccess) {
                navigate(-1);
            } else {
                setErrMsg(response.data?.message || "Failed to save video. Try again...");
            }
        } catch (error) {
            console.error("Error submitting video:", error);
            setErrMsg(error.response?.data?.message || "Failed to save video. Try again...");
        } finally {
            setIsLoading(false);
        }
    }

    const handleUpdate = async (lesson_id, video_provider_id, ui_style) => {
        if (!initialData?.id) {
            setErrMsg("Video ID not found. Cannot update.");
            return;
        }

        setIsLoading(true);
        setErrMsg("");

        try {
            const response = await axiosPrivate.put(`/api/v1/admin/video/${initialData.id}`, {
                lesson_id: parseInt(lesson_id),
                video_provider_id: video_provider_id,
                ui_style: ui_style
            });

            if (response.data?.isSuccess) {
                navigate(-1);
            } else {
                setErrMsg(response.data?.message || "Failed to update video. Try again...");
            }
        } catch (error) {
            console.error("Error updating video:", error);
            setErrMsg(error.response?.data?.message || "Failed to update video. Try again...");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <main className="pt-20 px-4 sm:px-6 lg:px-8 pb-12">
                <div className="max-w-4xl mx-auto">
                    {/* Back Button */}
                    <button
                        onClick={() => navigate(-1)}
                        className="group flex items-center gap-2 text-emerald-600 hover:text-emerald-700 mb-8 transition-colors font-bold"
                    >
                        <FaArrowLeft />
                        <span>Back to Lesson</span>
                    </button>

                    {/* Hero Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                <FaVideo className="text-xl" />
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                {initialData?.video ? 'Manage Video' : 'Add New Video'}
                            </h1>
                        </div>
                        <p className="text-gray-600">
                            {initialData?.video 
                                ? 'Review current video or replace it with a new link.' 
                                : 'Paste a Vimeo link to attach it to this lesson.'}
                        </p>
                    </div>

                    {/* Error Message */}
                    {errMsg && (
                        <div className="mb-6 animate-fadeIn">
                            <div className="bg-red-50 border-l-4 border-red-500 p-4 flex items-start gap-3">
                                <FaExclamationCircle className="text-red-500 mt-0.5" />
                                <p className="text-red-700 font-medium">{errMsg}</p>
                            </div>
                        </div>
                    )}

                    {/* Main Content */}
                    {isLoading ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-20 text-center">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent mb-4"></div>
                            <p className="text-gray-500 font-medium">Processing...</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                            <UploadForm
                                id={id}
                                onSubmit={handleSubmit}
                                initialData={initialData}
                                onUpdate={handleUpdate}
                            />
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}

export default UploadVideo;
